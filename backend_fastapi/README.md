# LoanShield AI - FastAPI Backend

Primary backend service built with Python FastAPI. Handles loan agreement analysis, risk scoring, SECP regulatory checks (Circular 10, 15, 22), hidden fee detection, and user authentication with bcrypt password hashing.

---

## Quick Setup

### 1. Virtual Environment
```bash
cd backend_fastapi
python3 -m venv venv
# Linux / macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
```bash
cp ../.env.example ../.env
# Add your Gemini API key to .env
```

### 4. Run Server
```bash
uvicorn main:app --reload --port 8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/demo-scenarios` | Preloaded demo scenarios |
| `POST` | `/api/analyze/upload` | Analyze document/contract (PDF, image, text) |
| `POST` | `/api/analyze/manual` | Calculate loan breakdown manually |
| `GET` | `/api/analysis/{id}` | Fetch analysis result |
| `GET` | `/api/analysis-history` | View analysis history |
| `DELETE` | `/api/analysis/{id}` | Delete an analysis |
| `POST` | `/api/ask-advisor` | AI legal & lending advisor chat |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login user |

### Interactive Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Key Features
- **Rate limiting**: 10 requests/minute on upload endpoints (via Slowapi)
- **Password hashing**: bcrypt via Passlib
- **Body size limit**: 25MB max for base64 uploads
- **Demo data seeding**: Auto-creates demo user and scenarios on startup
- **Email validation**: Pydantic field validators on auth endpoints
