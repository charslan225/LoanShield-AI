import uuid
import bcrypt
from typing import Dict, Any, List, Optional
from datetime import datetime

class StorageManager:
    def __init__(self):
        self.analyses: Dict[str, Dict[str, Any]] = {}
        self.users: Dict[str, Dict[str, Any]] = {}

    def save_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis_id = analysis_data.get("id") or str(uuid.uuid4())
        analysis_data["id"] = analysis_id
        if "createdAt" not in analysis_data:
            analysis_data["createdAt"] = datetime.utcnow().isoformat() + "Z"
        self.analyses[analysis_id] = analysis_data
        return analysis_data

    def get_analysis_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        return self.analyses.get(analysis_id)

    def get_all_analyses(self) -> List[Dict[str, Any]]:
        return sorted(list(self.analyses.values()), key=lambda x: x.get("createdAt", ""), reverse=True)

    def delete_analysis(self, analysis_id: str) -> bool:
        if analysis_id in self.analyses:
            del self.analyses[analysis_id]
            return True
        return False

    def create_user(self, name: str, email: str, password: Optional[str] = None) -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8") if password else ""
        user = {
            "id": user_id,
            "name": name,
            "email": email.lower(),
            "password": hashed,
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }
        self.users[email.lower()] = user
        return user

    def verify_password(self, plain: str, hashed: str) -> bool:
        if not hashed:
            return False
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return self.users.get(email.lower())

    def seed_demo_data(self):
        if not self.get_user_by_email("ali.khan@example.com"):
            self.create_user("Ali Khan", "ali.khan@example.com", "demopassword123")

storage = StorageManager()
