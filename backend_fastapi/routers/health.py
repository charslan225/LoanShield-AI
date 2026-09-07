from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()


@router.get('/api/health')
def health_check():
    return {
        'status': 'ok',
        'service': 'LoanShield AI Server',
        'version': '1.0.0',
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
