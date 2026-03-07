"""
Insight Engine
Merges outputs from combo and sales models and saves structured insights.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
INSIGHTS_PATH = DATA_DIR / "ai_structured_insights.json"


def merge_insights(combo_insights: list[dict], sales_insights: list[dict]) -> dict:
    """Combine combo and sales insights into a single structure."""
    return {
        "structured_insights": combo_insights + sales_insights,
        "combo_count": len(combo_insights),
        "sales_count": len(sales_insights),
    }


def save_insights(insights: dict) -> str:
    """Save merged insights to JSON file. Returns the file path."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(INSIGHTS_PATH, "w", encoding="utf-8") as f:
        json.dump(insights, f, indent=2)
    return str(INSIGHTS_PATH)


def load_insights() -> dict:
    """Load structured insights from the cache file."""
    if not INSIGHTS_PATH.exists():
        return {"structured_insights": [], "combo_count": 0, "sales_count": 0}
    with open(INSIGHTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    data = load_insights()
    print(f"Loaded {len(data.get('structured_insights', []))} insight(s)")
