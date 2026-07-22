# DG Cluster Assortment Advisor

A decision-support tool that helps Dollar General category managers decide which Snacks products to add, keep, swap, or remove in their Small Town Value Cluster stores — balancing sales performance, shelf space, and private brand goals.

## Features

- **KPI Header Strip**: Displays Sales per Linear Ft, Private Brand %, In-Stock Rate, and Shelf Capacity.
- **SKU Performance Section**: Table of Snacks SKUs with performance metrics and status badges.
- **Scenario Selector**: Side-by-side selectable option cards (Conservative / Balanced / Aggressive) with projected impact metrics.
- **Approval Review Panel**: Summary of the currently selected scenario, SKU action list, guardrail status checks, and Submit button.
- **Inline Confirmation**: Success confirmation showing the audit-trail summary.

---

## Server Setup & Usage

### Prerequisites

- Python 3.11+
- pip / uv

### Installation

1. Navigate to the repository root.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server

Start the FastAPI development server on port 8000:
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive API documentation will be available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Running Tests

Run the backend test suite using pytest:
```bash
pytest
```

---

## Full-Stack Local Development

To run both the backend and frontend together locally:

### 1. Start the Backend (Port 8000)
```bash
# From the repo root
source venv/bin/activate
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start the Frontend (Port 5173)
```bash
# From the client/ directory
cd client
npm install
npm run dev
```

### Default Ports & Configuration

- **Backend API**: `http://localhost:8000` (configured via `--port` in uvicorn)
- **Frontend Dev Server**: `http://localhost:5173` (Vite default)

To configure custom ports or settings, create a `.env` file at the repo root:
```env
DATABASE_URL=sqlite:///./test.db
JWT_SECRET_KEY=dev-secret-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```
