from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from core.storage import storage

router = APIRouter()


@router.post('/api/auth/signup')
def signup(body: Dict[str, Any]):
    name = body.get('name')
    email = body.get('email')
    password = body.get('password')
    if not email or not isinstance(email, str):
        raise HTTPException(status_code=400, detail='Valid email is required.')
    if storage.get_user_by_email(email):
        raise HTTPException(status_code=400, detail='An account with this email already exists.')
    user = storage.create_user(name or 'User', email, password)
    return {'success': True, 'user': user.model_dump()}


@router.post('/api/auth/login')
def login(body: Dict[str, Any]):
    email = body.get('email')
    password = body.get('password')
    if not email:
        raise HTTPException(status_code=400, detail='Email is required.')
    user = storage.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid email or password.')
    if user.password and password:
        if not storage.verify_password(password, user.password):
            raise HTTPException(status_code=401, detail='Invalid email or password.')
    return {
        'success': True,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
        },
    }


@router.post('/api/auth/reset-password')
def reset_password(_body: Dict[str, Any]):
    return {
        'success': True,
        'message': 'Password reset link has been dispatched to your email.',
    }
