# 🛡️ LoanShield AI - Python FastAPI Backend

FastAPI پر مبنی مکمل بیک اینڈ سروس جو لون ایگریمنٹس، ہائی رسک ٹرمز، SECP ریگولیٹری رولز (Circular 10, 15, 22)، اور ہڈن فیس کو اینالائز کرتی ہے۔

---

## 🚀 Quick Setup & Run (چلانے کا طریقہ)

### 1. Create Python Virtual Environment (ورچوئل انوائرمنٹ بنائیں)
```bash
# Navigate to backend folder
cd backend_fastapi

# Create venv
python3 -m venv venv

# Activate venv
# Linux / macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. Install Dependencies (لائبریریز انسٹال کریں)
```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables (انوائرمنٹ ویری ایبل)
```bash
cp .env.example .env
# .env فائل میں اپنی مفت Gemini API Key ڈالیں
```

### 4. Run FastAPI Server (سرور اسٹارٹ کریں)
```bash
uvicorn main:app --reload --port 8000
```

---

## 📖 Interactive API Documentation (Swagger UI)
جب سرور چل پڑے، تو براؤزر میں یہ لنکس کھولیں:
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/demo-scenarios` | Preloaded sample scenarios |
| `POST` | `/api/analyze/upload` | Analyze Document / Contract (PDF, Image, Text) |
| `POST` | `/api/analyze/manual` | Calculate loan breakdown & APR manually |
| `GET` | `/api/analysis/{id}` | Fetch detailed analysis results |
| `GET` | `/api/analysis-history` | View history of analyzed agreements |
| `DELETE` | `/api/analysis/{id}` | Delete an analysis record |
| `POST` | `/api/ask-advisor` | Ask AI Legal & Lending Advisor questions |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login user |
