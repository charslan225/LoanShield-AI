import json
from pathlib import Path
from typing import List

from models import AnalysisResult, DemoScenario


def _load_demo_data() -> List[DemoScenario]:
    data_path = Path(__file__).parent.parent / 'data' / 'demoScenarios.json'
    with open(data_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    return [DemoScenario.model_validate(item) for item in raw]


DEMO_SCENARIOS: List[DemoScenario] = _load_demo_data()
