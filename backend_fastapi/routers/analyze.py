from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from core.analyzer import AnalysisInputParams, analyze_loan_document
from core.storage import storage
from models import AnalysisResult

router = APIRouter()


def _build_params(body: Dict[str, Any], method: str) -> AnalysisInputParams:
    return AnalysisInputParams(
        method=method,
        lenderName=body.get('lenderName'),
        appName=body.get('appName'),
        advertisedAmount=body.get('advertisedAmount'),
        advertisedDuration=body.get('advertisedDuration'),
        advertisedMarkupRate=body.get('advertisedMarkupRate'),
        expectedRepayment=body.get('expectedRepayment'),
        requestedPermissions=body.get('requestedPermissions'),
        fileBase64=body.get('fileBase64'),
        fileMimeType=body.get('fileMimeType'),
        fileName=body.get('fileName'),
        rawText=body.get('rawText'),
        manualPrincipal=body.get('manualPrincipal'),
        manualDurationDays=body.get('manualDurationDays'),
        manualMarkupRateAnnual=body.get('manualMarkupRateAnnual'),
        manualUpfrontDeductions=body.get('manualUpfrontDeductions'),
        manualChargesDescription=body.get('manualChargesDescription'),
    )


@router.post('/api/analyze/upload')
async def analyze_upload(body: Dict[str, Any]) -> Dict[str, Any]:
    try:
        params = _build_params(body, body.get('method') or 'AGREEMENT_UPLOAD')
        analysis = await analyze_loan_document(params)
        saved = storage.save_analysis(analysis)
        return {'success': True, 'analysis': saved.model_dump()}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.post('/api/analyze/manual')
async def analyze_manual(body: Dict[str, Any]) -> Dict[str, Any]:
    try:
        params = _build_params(body, 'MANUAL_ENTRY')
        analysis = await analyze_loan_document(params)
        saved = storage.save_analysis(analysis)
        return {'success': True, 'analysis': saved.model_dump()}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
