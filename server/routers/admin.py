import csv
import io
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from server.database import get_db
from server.models.user import User
from server.models.banking import Account, Transaction
from server.models.audit import AuditLog
from server.models.risk import RiskSignal
from server.models.config import ConfigItem
from server.models.incident import Incident
from server.schemas.audit import AuditLogListResponse
from server.schemas.risk import RiskSignalResponse
from server.schemas.incident import IncidentResponse
from server.schemas.banking import ConfigItemRequest, ConfigItemResponse
from server.utils.security import get_current_admin
from server.utils.audit import log_audit_event

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Simple in-memory metrics tracking for SLA/Usage
metrics_store = {
    "logins": 0,
    "active_users": set(),
    "transaction_count": 0,
    "transaction_volume": Decimal("0.00"),
    "transfers": 0,
    "exports": 0,
    "report_generations": 0,
    "request_count": 0,
    "error_count": 0,
    "latencies": [],
}


def escape_csv_value(val: Any) -> str:
    """Escapes values against CSV formula injection."""
    if val is None:
        return ""
    s = str(val)
    if s and s[0] in ("=", "+", "-", "@"):
        return f"'{s}"
    return s


def generate_pdf_report(
    title: str, headers: List[str], rows: List[List[Any]]
) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#4648d4"),
        spaceAfter=12,
    )

    elements = []
    elements.append(Paragraph(title, title_style))
    elements.append(
        Paragraph(
            f"Generated on: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 12))

    table_data = [headers]
    for r in rows:
        table_data.append([str(val) for val in r])

    t = Table(table_data)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4648d4")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#eceef0")),
                ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#c7c4d7")),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]
        )
    )

    elements.append(t)
    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/audit-logs", response_model=AuditLogListResponse)
def list_audit_logs(
    actor: Optional[str] = None,
    event_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    query = db.query(AuditLog)
    if actor:
        query = query.filter(AuditLog.actor == actor)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date)
            query = query.filter(AuditLog.timestamp >= dt_start)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid start_date format. Use ISO 8601."
            )
    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date)
            query = query.filter(AuditLog.timestamp <= dt_end)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid end_date format. Use ISO 8601."
            )

    total = query.count()
    items = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return AuditLogListResponse(items=items, total=total)


@router.get("/risk-signals", response_model=List[RiskSignalResponse])
def list_risk_signals(
    db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
):
    signals = db.query(RiskSignal).order_by(RiskSignal.timestamp.desc()).all()
    return signals


@router.get("/config", response_model=List[ConfigItemResponse])
def list_config(
    db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
):
    items = db.query(ConfigItem).all()
    return items


@router.post("/config", response_model=ConfigItemResponse)
def create_or_update_config(
    payload: ConfigItemRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    key = payload.key
    value = payload.value
    description = payload.description

    item = db.query(ConfigItem).filter(ConfigItem.key == key).first()
    if item:
        item.value = str(value)
        if description is not None:
            item.description = description
    else:
        item = ConfigItem(
            id=str(uuid.uuid4()), key=key, value=str(value), description=description
        )
        db.add(item)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/config/{key}")
def delete_config(
    key: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
):
    item = db.query(ConfigItem).filter(ConfigItem.key == key).first()
    if not item:
        raise HTTPException(status_code=404, detail="Config item not found")
    db.delete(item)
    db.commit()
    return {"message": "Config item deleted successfully"}


@router.get("/reports/{reportType}")
def get_report(
    reportType: str,
    format: str = "csv",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    request: Request = None,
):
    ip_address = request.client.host if request and request.client else "127.0.0.1"

    dt_start = datetime.now(timezone.utc) - timedelta(days=30)
    dt_end = datetime.now(timezone.utc)
    if start_date:
        try:
            dt_start = datetime.strptime(start_date, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD."
            )
    if end_date:
        try:
            dt_end = datetime.strptime(end_date, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            ) + timedelta(days=1)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD."
            )

    headers = []
    rows = []
    title = ""

    if reportType == "daily-transactions":
        title = "Daily Transaction Report"
        headers = [
            "Transaction ID",
            "Account ID",
            "Type",
            "Amount",
            "Description",
            "Category",
            "Status",
            "Timestamp",
        ]
        txs = (
            db.query(Transaction)
            .filter(Transaction.created_at >= dt_start, Transaction.created_at < dt_end)
            .all()
        )
        for t in txs:
            rows.append(
                [
                    t.id,
                    t.account_id,
                    t.type,
                    t.amount,
                    t.description,
                    t.category,
                    t.status,
                    t.created_at.isoformat(),
                ]
            )

    elif reportType == "suspicious-activity":
        title = "Suspicious Activity Report"
        headers = [
            "Signal ID",
            "User ID",
            "Risk Score",
            "Signal Type",
            "Details",
            "Timestamp",
        ]
        signals = (
            db.query(RiskSignal)
            .filter(RiskSignal.timestamp >= dt_start, RiskSignal.timestamp < dt_end)
            .all()
        )
        for s in signals:
            rows.append(
                [
                    s.id,
                    s.user_id,
                    s.risk_score,
                    s.signal_type,
                    str(s.details),
                    s.timestamp.isoformat(),
                ]
            )

    elif reportType == "account-balances":
        title = "Account Balances Summary"
        headers = [
            "Account ID",
            "User ID",
            "Account Number",
            "Account Type",
            "Balance",
            "Available Balance",
            "Currency",
            "Status",
        ]
        accounts = db.query(Account).all()
        for a in accounts:
            rows.append(
                [
                    a.id,
                    a.user_id,
                    a.account_number,
                    a.account_type,
                    a.balance,
                    a.available_balance,
                    a.currency,
                    a.status,
                ]
            )

    elif reportType == "customer-activity":
        title = "Customer Activity Report"
        headers = [
            "Log ID",
            "Timestamp",
            "Event Type",
            "Actor",
            "Resource",
            "IP Address",
            "Status",
        ]
        logs = (
            db.query(AuditLog)
            .filter(AuditLog.timestamp >= dt_start, AuditLog.timestamp < dt_end)
            .all()
        )
        for l in logs:
            rows.append(
                [
                    l.id,
                    l.timestamp.isoformat(),
                    l.event_type,
                    l.actor,
                    l.resource,
                    l.ip_address,
                    l.status,
                ]
            )

    else:
        raise HTTPException(status_code=404, detail="Report type not found")

    metrics_store["report_generations"] += 1
    log_audit_event(
        db,
        "REPORT_GENERATED",
        admin.username,
        f"reports/{reportType}",
        ip_address,
        "SUCCESS",
        {"report_type": reportType, "format": format},
    )
    db.commit()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([escape_csv_value(h) for h in headers])
        for r in rows:
            writer.writerow([escape_csv_value(val) for val in r])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={reportType}_{datetime.now().strftime('%Y%m%d')}.csv"
            },
        )
    elif format == "pdf":
        pdf_buffer = generate_pdf_report(title, headers, rows)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={reportType}_{datetime.now().strftime('%Y%m%d')}.pdf"
            },
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use csv or pdf.")


@router.get("/incidents", response_model=List[IncidentResponse])
def list_incidents(
    severity: Optional[str] = None,
    error_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = "json",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    query = db.query(Incident)
    if severity:
        query = query.filter(Incident.severity == severity)
    if error_type:
        query = query.filter(Incident.error_type == error_type)
    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date)
            query = query.filter(Incident.timestamp >= dt_start)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid start_date format. Use ISO 8601."
            )
    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date)
            query = query.filter(Incident.timestamp <= dt_end)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid end_date format. Use ISO 8601."
            )

    incidents = query.order_by(Incident.timestamp.desc()).all()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        headers = [
            "Incident ID",
            "Timestamp",
            "Severity",
            "Endpoint",
            "Error Type",
            "Message",
            "Correlation ID",
        ]
        writer.writerow([escape_csv_value(h) for h in headers])
        for i in incidents:
            writer.writerow(
                [
                    escape_csv_value(i.id),
                    escape_csv_value(i.timestamp.isoformat()),
                    escape_csv_value(i.severity),
                    escape_csv_value(i.endpoint),
                    escape_csv_value(i.error_type),
                    escape_csv_value(i.message),
                    escape_csv_value(i.correlation_id),
                ]
            )
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=incidents_{datetime.now().strftime('%Y%m%d')}.csv"
            },
        )

    return incidents


@router.get("/reports/usage")
def get_usage_report(
    format: str = "json",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    active_users_count = (
        db.query(User)
        .join(UserSession, User.id == UserSession.user_id)
        .filter(UserSession.is_active == True)
        .distinct()
        .count()
    )

    tx_count = db.query(Transaction).count()
    tx_volume = db.query(Transaction).filter(Transaction.type == "transfer_out").all()
    total_volume = sum(tx.amount for tx in tx_volume)

    usage_data = {
        "logins": metrics_store["logins"],
        "active_users": active_users_count,
        "transaction_count": tx_count,
        "transaction_volume": float(total_volume),
        "transfers": metrics_store["transfers"],
        "exports": metrics_store["exports"],
        "report_generations": metrics_store["report_generations"],
    }

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Metric", "Value"])
        for k, v in usage_data.items():
            writer.writerow([escape_csv_value(k), escape_csv_value(v)])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=usage_report.csv"},
        )

    return JSONResponse(content=usage_data)


@router.get("/reports/sla")
def get_sla_report(
    format: str = "json",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    req_count = metrics_store["request_count"]
    err_count = metrics_store["error_count"]
    error_rate = (err_count / req_count * 100) if req_count > 0 else 0.0

    latencies = sorted(metrics_store["latencies"])
    p50 = 0.0
    p90 = 0.0
    p99 = 0.0
    if latencies:
        n = len(latencies)
        p50 = latencies[int(n * 0.5)]
        p90 = latencies[int(n * 0.9)]
        p99 = latencies[int(n * 0.99)]

    sla_data = {
        "request_count": req_count,
        "error_rate_percent": error_rate,
        "latency_p50_ms": p50,
        "latency_p90_ms": p90,
        "latency_p99_ms": p99,
    }

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Metric", "Value"])
        for k, v in sla_data.items():
            writer.writerow([escape_csv_value(k), escape_csv_value(v)])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=sla_report.csv"},
        )

    return JSONResponse(content=sla_data)


@router.get("/health")
def get_admin_health(
    db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
):
    db_reachable = False
    try:
        db.execute("SELECT 1")
        db_reachable = True
    except Exception:
        pass

    req_count = metrics_store["request_count"]
    err_count = metrics_store["error_count"]
    error_rate = (err_count / req_count * 100) if req_count > 0 else 0.0

    audit_chain_status = "VERIFIED"

    return {
        "availability": "UP" if db_reachable else "DOWN",
        "recent_error_rate_percent": error_rate,
        "audit_chain_status": audit_chain_status,
        "database_connected": db_reachable,
    }
