from datetime import datetime, timezone
from typing import Dict, Optional
from uuid import uuid4

import bcrypt

from core.demo_scenarios import DEMO_SCENARIOS
from models import AnalysisResult, StoredUser, UserProfile


class StorageManager:
    def __init__(self) -> None:
        self._analyses: Dict[str, AnalysisResult] = {}
        self._users: Dict[str, StoredUser] = {}
        self._seed_demo_data()

    def _seed_demo_data(self) -> None:
        for scenario in DEMO_SCENARIOS:
            if scenario.resultData and scenario.resultData.id:
                self._analyses[scenario.resultData.id] = scenario.resultData

        demo_email = 'ali.khan@example.com'
        if demo_email not in self._users:
            self._users[demo_email] = StoredUser(
                id='user-demo-ali',
                name='Ali Khan',
                email=demo_email,
                password=bcrypt.hashpw('demopassword123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                createdAt=datetime.now(timezone.utc).isoformat(),
            )

    def save_analysis(self, analysis: AnalysisResult) -> AnalysisResult:
        if not analysis.id:
            analysis.id = f'analysis-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{uuid4().hex[:5]}'
        if not analysis.createdAt:
            analysis.createdAt = datetime.now(timezone.utc).isoformat()
        self._analyses[analysis.id] = analysis
        return analysis

    def get_analysis_by_id(self, analysis_id: str) -> Optional[AnalysisResult]:
        return self._analyses.get(analysis_id)

    def get_all_analyses(self) -> list[AnalysisResult]:
        return sorted(
            self._analyses.values(),
            key=lambda a: datetime.fromisoformat(a.createdAt),
            reverse=True,
        )

    def delete_analysis(self, analysis_id: str) -> bool:
        return analysis_id in self._analyses and bool(self._analyses.pop(analysis_id))

    def create_user(self, name: str, email: str, password: Optional[str] = None) -> UserProfile:
        lower_email = email.lower().strip()
        user = StoredUser(
            id=f'user-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{uuid4().hex[:5]}',
            name=name or 'User',
            email=lower_email,
            password=bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') if password else None,
            createdAt=datetime.now(timezone.utc).isoformat(),
        )
        self._users[lower_email] = user
        return UserProfile(id=user.id, name=user.name, email=user.email)

    def verify_password(self, plain: str, hashed: str) -> bool:
        if not hashed:
            return False
        try:
            return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            return False

    def get_user_by_email(self, email: str) -> Optional[StoredUser]:
        return self._users.get(email.lower().strip())


storage = StorageManager()
