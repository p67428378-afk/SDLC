# DG Cluster Assortment Advisor Backend

This is the backend service for the DG Cluster Assortment Advisor, built with Python 3.11 and FastAPI.

## Setup and Installation

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the environment variables template and configure:
   ```bash
   cp .env.example .env
   ```

## Running the Server

Start the FastAPI development server:
```bash
uvicorn server.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive API documentation (Swagger UI) will be available at `http://localhost:8000/docs`.

## Running Tests

Run the test suite using pytest:
```bash
pytest
```
