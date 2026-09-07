from fastapi import APIRouter, HTTPException

from core.storage import storage

router = APIRouter()


@router.get('/api/analysis/{analysis_id}')
def get_analysis(analysis_id: str):
    analysis = storage.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail='Analysis not found.')
    return {'success': True, 'analysis': analysis.model_dump()}


@router.get('/api/analysis-history')
def analysis_history():
    all_analyses = storage.get_all_analyses()
    history = [
        {
            'id': a.id,
            'createdAt': a.createdAt,
            'lenderName': a.lenderName,
            'analysisMethod': a.analysisMethod,
            'isDemo': a.isDemo or False,
            'principalAmount': a.financialBreakdown.principalAmount or 0,
            'actualDisbursed': a.financialBreakdown.actualDisbursedAmount,
            'totalRepayment': a.financialBreakdown.totalRepaymentAmount,
            'riskScore': a.riskAssessment.overallScore or 0,
            'riskLevel': a.riskAssessment.riskLevel or 'LOW',
            'riskTitle': a.riskAssessment.riskTitle or '',
        }
        for a in all_analyses
    ]
    return {'success': True, 'history': history}


@router.delete('/api/analysis/{analysis_id}')
def delete_analysis(analysis_id: str):
    deleted = storage.delete_analysis(analysis_id)
    return {
        'success': deleted,
        'message': 'Analysis record deleted.' if deleted else 'Record not found.',
    }
