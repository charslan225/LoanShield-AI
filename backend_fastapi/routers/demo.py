from fastapi import APIRouter

from core.demo_scenarios import DEMO_SCENARIOS

router = APIRouter()


@router.get('/api/demo-scenarios')
def demo_scenarios():
    return {'success': True, 'scenarios': [s.model_dump() for s in DEMO_SCENARIOS]}
