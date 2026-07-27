import time
import uuid
import traceback
from datetime import datetime, timezone
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.models.incident import Incident
from server.routers import auth, sessions, banking, admin, messages, alerts, webhooks
from server.routers.admin import metrics_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="ApexSecure API",
    description="Secure Customer Authentication and Session Management with Full Retail Banking Capabilities",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware to track metrics and capture unhandled exceptions
@app.middleware("http")
async def metrics_and_exceptions_middleware(request: Request, call_next):
    correlation_id = str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    start_time = time.time()
    metrics_store["request_count"] += 1

    ip_address = request.client.host if request.client else "127.0.0.1"
    metrics_store["active_users"].add(ip_address)

    try:
        response: Response = await call_next(request)

        # Track latency
        latency_ms = (time.time() - start_time) * 1000
        metrics_store["latencies"].append(latency_ms)

        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = correlation_id

        if response.status_code >= 500:
            metrics_store["error_count"] += 1

        return response
    except Exception as exc:
        metrics_store["error_count"] += 1
        latency_ms = (time.time() - start_time) * 1000
        metrics_store["latencies"].append(latency_ms)

        # Print the traceback to stdout so we can see it!
        traceback.print_exc()

        # Capture incident in database
        db = SessionLocal()
        try:
            incident = Incident(
                id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                severity="CRITICAL",
                endpoint=str(request.url.path),
                error_type=type(exc).__name__,
                message=str(exc),
                correlation_id=correlation_id,
            )
            db.add(incident)
            db.commit()
        except Exception as db_err:
            print(f"Failed to save incident to DB: {db_err}")
        finally:
            db.close()

        # Return clean error response with correlation ID
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred. Please contact support.",
                "correlation_id": correlation_id,
            },
            headers={"X-Correlation-ID": correlation_id},
        )


# Include Routers
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(banking.router)
app.include_router(admin.router)
app.include_router(messages.router)
app.include_router(alerts.router)
app.include_router(webhooks.router)


# Liveness and Readiness Checks
@app.get("/health", response_model=dict)
@app.get("/liveness", response_model=dict)
def liveness():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/readiness", response_model=dict)
def readiness():
    # Verify database reachability
    db = SessionLocal()
    try:
        db.execute("SELECT 1")
        return {
            "status": "ready",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "error": str(exc),
            },
        )
    finally:
        db.close()


# Prometheus-compatible metrics endpoint
@app.get("/metrics")
def get_metrics():
    req_count = metrics_store["request_count"]
    err_count = metrics_store["error_count"]
    error_rate = (err_count / req_count) if req_count > 0 else 0.0

    latencies = sorted(metrics_store["latencies"])
    p50 = latencies[int(len(latencies) * 0.5)] if latencies else 0.0
    p90 = latencies[int(len(latencies) * 0.9)] if latencies else 0.0

    # Format as Prometheus text format
    metrics_text = (
        f"# HELP http_requests_total Total number of HTTP requests\n"
        f"# TYPE http_requests_total counter\n"
        f"http_requests_total {req_count}\n"
        f"# HELP http_errors_total Total number of HTTP errors\n"
        f"# TYPE http_errors_total counter\n"
        f"http_errors_total {err_count}\n"
        f"# HELP http_error_rate HTTP error rate\n"
        f"# TYPE http_error_rate gauge\n"
        f"http_error_rate {error_rate}\n"
        f"# HELP http_latency_p50_ms HTTP latency 50th percentile in ms\n"
        f"# TYPE http_latency_p50_ms gauge\n"
        f"http_latency_p50_ms {p50}\n"
        f"# HELP http_latency_p90_ms HTTP latency 90th percentile in ms\n"
        f"# TYPE http_latency_p90_ms gauge\n"
        f"http_latency_p90_ms {p90}\n"
    )
    return Response(content=metrics_text, media_type="text/plain")
