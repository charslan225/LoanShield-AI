from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from core.gemini_service import answer_advisor_question
from core.storage import storage

router = APIRouter()


@router.post('/api/ask-advisor')
async def ask_advisor(body: Dict[str, Any]):
    question = body.get('question')
    analysis_id = body.get('analysisId')
    if not question:
        raise HTTPException(status_code=400, detail='Question is required.')

    analysis = storage.get_analysis_by_id(analysis_id) if analysis_id else None
    answer = await answer_advisor_question(analysis or {}, question)
    return {'success': True, 'answer': answer}
