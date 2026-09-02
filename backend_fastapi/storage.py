import uuid
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
        user = {
            "id": user_id,
            "name": name,
            "email": email.lower(),
            "password": password or "",
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }
        self.users[email.lower()] = user
        return user

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return self.users.get(email.lower())

storage = StorageManager()
