import os
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

try:
    from models import (
        LoanAnalysisRequest,
        ManualAnalysisRequest,
        AdvisorQuestionRequest,
        AuthSignUpRequest,
        AuthLoginRequest,
        AuthResetRequest
    )
    from gemini_service import analyze_loan_document, answer_advisor_question
    from storage import storage
    from demo_data import DEMO_ANALYSES
except (ImportError, ValueError):
    from .models import (
        LoanAnalysisRequest,
        ManualAnalysisRequest,
        AdvisorQuestionRequest,
        AuthSignUpRequest,
        AuthLoginRequest,
        AuthResetRequest
    )
    from .gemini_service import analyze_loan_document, answer_advisor_question
    from .storage import storage
    from .demo_data import DEMO_ANALYSES

app = FastAPI(
    title="LoanShield AI - Python FastAPI Backend",
    description="Intelligent Digital Lending Transparency & SECP Compliance Engine",
    version="1.0.0"
)

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Body size limit middleware (25MB max)
class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 25 * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large. Maximum 25MB allowed."}
            )
        return await call_next(request)

app.add_middleware(BodySizeLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    storage.seed_demo_data()

# ==========================================
# 1. Health Check
# ==========================================
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "LoanShield AI Python FastAPI Server",
        "version": "1.0.0"
    }

# ==========================================
# 2. Get Demo Scenarios
# ==========================================
@app.get("/api/demo-scenarios")
def get_demo_scenarios():
    scenarios = [
        {
            "id": "transparent-nbfe",
            "title": "Scenario 1: Transparent Regulated Offer",
            "tagline": "SECP-Compliant NBFC with clear fee schedule and minimal permissions",
            "riskBadge": "LOW",
            "lenderName": "Karobar Asaan Microfinance (Fictional)",
            "advertisedText": "Advertised: PKR 50,000 Business Loan at 2% monthly markup for 90 days.",
            "contractSnippet": "LOAN FACILITY AGREEMENT\nLender: Karobar Asaan Microfinance Limited",
            "samplePermissions": ["CAMERA", "PHONE_STATE"],
            "resultId": "demo-result-1"
        },
        {
            "id": "hidden-fee-wallet",
            "title": "Scenario 2: Heavy Hidden Upfront Fees",
            "tagline": "Wallet app with 25% hidden upfront deductions and aggressive permissions",
            "riskBadge": "HIGH",
            "lenderName": "QuickCash Instant Wallet (Fictional)",
            "advertisedText": "Get PKR 30,000 instantly! Zero processing fee advertised.",
            "contractSnippet": "Service charges and platform fees apply at disbursement.",
            "samplePermissions": ["READ_CONTACTS", "ACCESS_FINE_LOCATION", "CAMERA", "READ_SMS"],
            "resultId": "demo-result-2"
        },
        {
            "id": "predatory-rollover",
            "title": "Scenario 3: 7-Day Rollover Trap",
            "tagline": "Predatory 7-day rollover with 300%+ effective APR",
            "riskBadge": "VERY_HIGH",
            "lenderName": "EasyMoney Express 24/7 (Fictional)",
            "advertisedText": "Borrow PKR 10,000 for 7 days at just PKR 500 fee!",
            "contractSnippet": "Auto-rollover enabled. Late fee PKR 2,000 per day.",
            "samplePermissions": ["READ_CONTACTS", "READ_SMS", "READ_CALL_LOG", "ACCESS_FINE_LOCATION"],
            "resultId": "demo-result-3"
        }
    ]
    return {"success": True, "scenarios": scenarios}

# ==========================================
# 3. AI Document Analysis (Upload)
# ==========================================
@app.post("/api/analyze/upload")
@limiter.limit("10/minute")
async def analyze_upload(request: Request, body: LoanAnalysisRequest):
    if not body.fileBase64 and not body.rawText:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either an uploaded file or document text."
        )
    try:
        result = await analyze_loan_document(body.model_dump())
        storage.save_analysis(result)
        return {"success": True, "analysis": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failure: {str(e)}"
        )

# ==========================================
# 4. AI Document Analysis (Manual Entry)
# ==========================================
@app.post("/api/analyze/manual")
@limiter.limit("10/minute")
async def analyze_manual(request: Request, body: ManualAnalysisRequest):
    try:
        data = body.model_dump()
        data["method"] = "MANUAL_ENTRY"
        result = await analyze_loan_document(data)
        storage.save_analysis(result)
        return {"success": True, "analysis": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation failure: {str(e)}"
        )

# ==========================================
# 5. Get Analysis by ID
# ==========================================
@app.get("/api/analysis/{analysis_id}")
def get_analysis(analysis_id: str):
    analysis = storage.get_analysis_by_id(analysis_id)
    if not analysis:
        analysis = DEMO_ANALYSES.get(analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found."
        )
    return {"success": True, "analysis": analysis}

# ==========================================
# 6. Get Analysis History
# ==========================================
@app.get("/api/analysis-history")
def get_analysis_history():
    history = storage.get_all_analyses()
    return {
        "success": True,
        "history": [
            {
                "id": h["id"],
                "createdAt": h.get("createdAt"),
                "lenderName": h.get("lenderName"),
                "analysisMethod": h.get("analysisMethod"),
                "isDemo": h.get("isDemo", False),
                "principalAmount": h.get("financialBreakdown", {}).get("principalAmount"),
                "actualDisbursed": h.get("financialBreakdown", {}).get("actualDisbursedAmount"),
                "totalRepayment": h.get("financialBreakdown", {}).get("totalRepaymentAmount"),
                "riskScore": h.get("riskAssessment", {}).get("overallScore"),
                "riskLevel": h.get("riskAssessment", {}).get("riskLevel"),
                "riskTitle": h.get("riskAssessment", {}).get("riskTitle")
            }
            for h in history
        ]
    }

# ==========================================
# 7. Delete Analysis
# ==========================================
@app.delete("/api/analysis/{analysis_id}")
def delete_analysis(analysis_id: str):
    deleted = storage.delete_analysis(analysis_id)
    return {"success": True, "deleted": deleted}

# ==========================================
# 8. AI Loan Advisor Chat
# ==========================================
@app.post("/api/ask-advisor")
async def ask_advisor(body: AdvisorQuestionRequest):
    if not body.question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is required."
        )
    analysis = storage.get_analysis_by_id(body.analysisId)
    if not analysis:
        analysis = DEMO_ANALYSES.get(body.analysisId)
    if not analysis:
        analysis = {
            "lenderName": "Analyzed Loan Provider",
            "financialBreakdown": {"principalAmount": 50000, "effectiveAnnualPercentageRate": 45},
            "riskAssessment": {"overallScore": 55, "riskLevel": "MODERATE"}
        }
    answer = await answer_advisor_question(analysis, body.question)
    return {"success": True, "answer": answer}

# ==========================================
# 9. Authentication Endpoints
# ==========================================
@app.post("/api/auth/signup")
def signup(body: AuthSignUpRequest):
    existing = storage.get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = storage.create_user(body.name or "User", body.email, body.password)
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

@app.post("/api/auth/login")
def login(body: AuthLoginRequest):
    user = storage.get_user_by_email(body.email)
    if user and user.get("password"):
        if not storage.verify_password(body.password or "", user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
    elif not user:
        user = storage.create_user(body.email.split("@")[0], body.email, body.password)
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

@app.post("/api/auth/reset-password")
def reset_password(body: AuthResetRequest):
    return {
        "success": True,
        "message": f"If an account with {body.email} exists, a password reset link has been dispatched."
    }

# ==========================================
# 10. Serve Frontend (Production)
# ==========================================
dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.exists(dist_path):
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
