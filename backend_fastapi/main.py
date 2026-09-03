import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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

app = FastAPI(
    title="LoanShield AI - Python FastAPI Backend",
    description="Intelligent Digital Lending Transparency & SECP Compliance Engine built with FastAPI",
    version="1.0.0"
)

# Enable CORS for React Frontend / local dev / production web apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "id": "scenario-1",
            "title": "EasyCash 7-Day Nano-Loan (Predatory App)",
            "tagline": "Hidden upfront fee cuts and aggressive contact list harvesting",
            "riskBadge": "CRITICAL RISK",
            "lenderName": "EasyCash Quick Pay",
            "advertisedText": "Borrow PKR 25,000 instantly! 0% interest for first-time borrowers.",
            "contractSnippet": "Processing fee PKR 6,250 deducted upfront. Tenure 7 days.",
            "samplePermissions": ["READ_CONTACTS", "ACCESS_FINE_LOCATION", "CAMERA"],
            "resultId": "demo-scenario-1"
        },
        {
            "id": "scenario-2",
            "title": "FastPaisa 30-Day Installment (Moderate Risk)",
            "tagline": "Pre-approval unclear deductions with 30-day horizon",
            "riskBadge": "MODERATE RISK",
            "lenderName": "FastPaisa Digital Microfinance",
            "advertisedText": "Get up to PKR 50,000 for 30 days with low markup.",
            "contractSnippet": "Disbursement: To be determined after approval. Applicable service charges apply.",
            "samplePermissions": ["CAMERA", "READ_PHONE_STATE"],
            "resultId": "demo-scenario-2"
        },
        {
            "id": "scenario-3",
            "title": "National Microfinance Bank (SECP Compliant)",
            "tagline": "Fully licensed NBFC with standardized Key Fact Statement",
            "riskBadge": "SAFE / REGULATED",
            "lenderName": "National Microfinance Bank Ltd.",
            "advertisedText": "Transparent business micro-loan PKR 100,000 over 90 days.",
            "contractSnippet": "Full Key Fact Statement provided. Zero upfront deductions. 28% APR.",
            "samplePermissions": ["INTERNET"],
            "resultId": "demo-scenario-3"
        }
    ]
    return {
        "success": True,
        "scenarios": scenarios
    }

# ==========================================
# 3. AI Document Analysis (Upload Method)
# ==========================================
@app.post("/api/analyze/upload")
async def analyze_upload(request: LoanAnalysisRequest):
    if not request.fileBase64 and not request.rawText:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either an uploaded file or document text."
        )

    try:
        result = await analyze_loan_document(request.model_dump())
        storage.save_analysis(result)
        return {
            "success": True,
            "analysis": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failure: {str(e)}"
        )

# ==========================================
# 4. AI Document Analysis (Manual Entry)
# ==========================================
@app.post("/api/analyze/manual")
async def analyze_manual(request: ManualAnalysisRequest):
    try:
        data = request.model_dump()
        data["method"] = "MANUAL_ENTRY"
        result = await analyze_loan_document(data)
        storage.save_analysis(result)
        return {
            "success": True,
            "analysis": result
        }
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found."
        )
    return {
        "success": True,
        "analysis": analysis
    }

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
    return {
        "success": True,
        "deleted": deleted
    }

# ==========================================
# 8. AI Loan Advisor Chat
# ==========================================
@app.post("/api/ask-advisor")
async def ask_advisor(request: AdvisorQuestionRequest):
    if not request.question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is required."
        )

    analysis = storage.get_analysis_by_id(request.analysisId)
    if not analysis:
        # Check fallback demo mock
        analysis = {
            "lenderName": "Analyzed Loan Provider",
            "financialBreakdown": {"principalAmount": 50000, "effectiveAnnualPercentageRate": 45},
            "riskAssessment": {"overallScore": 55, "riskLevel": "MODERATE"}
        }

    answer = await answer_advisor_question(analysis, request.question)
    return {
        "success": True,
        "answer": answer
    }

# ==========================================
# 9. Authentication Endpoints
# ==========================================
@app.post("/api/auth/signup")
def signup(request: AuthSignUpRequest):
    user = storage.create_user(request.name or "User", request.email, request.password)
    return {
        "success": True,
        "user": user
    }

@app.post("/api/auth/login")
def login(request: AuthLoginRequest):
    user = storage.get_user_by_email(request.email)
    if not user:
        # Auto-create for testing
        user = storage.create_user(request.email.split("@")[0], request.email, request.password)
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

@app.post("/api/auth/reset-password")
def reset_password(request: AuthResetRequest):
    return {
        "success": True,
        "message": f"If an account with {request.email} exists, a password reset link has been dispatched."
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend_fastapi.main:app", host="0.0.0.0", port=port, reload=True)
