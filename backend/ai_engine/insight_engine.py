"""
Insight Engine
Merges outputs from combo and sales models and saves structured insights.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
INSIGHTS_PATH = DATA_DIR / "ai_structured_insights.json"


def merge_insights(combo_insights: list[dict], sales_insights: list[dict]) -> dict:
    """Combine combo, sales, and sentiment insights into a single structure."""
    from backend.ai_engine.sentiment_model import analyze_orders_sentiment
    
    sentiment_data = analyze_orders_sentiment()
    score = float(sentiment_data.get("score", 0.0))
    
    if score < -0.2:
        desc = "Customer sentiment is declining. Investigate service quality or food issues."
    elif score > 0.3:
        desc = "Customer satisfaction is high. Promote top-performing items."
    else:
        desc = "Customer sentiment is stable but has room for improvement."
        
    sentiment_insight = {
        "type": "Sentiment",
        "description": desc,
        "significance": "High" if abs(score) >= 0.3 else "Medium"
    }
    
    merged = combo_insights + sales_insights + [sentiment_insight]
    
    return {
        "structured_insights": merged,
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
