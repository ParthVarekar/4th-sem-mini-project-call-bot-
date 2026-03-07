"""
Gemma Reasoning Layer
Sends structured insights to local Ollama (gemma:2b) for business recommendations.
Falls back gracefully if Ollama is not available.
"""

import json
import requests
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
CACHE_PATH = DATA_DIR / "ai_recommendations_cache.json"

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3:1b"


def _build_prompt(insights: dict) -> str:
    """Convert structured insights into a human-readable prompt for Gemma."""
    lines = [
        "You are a restaurant business advisor. Based on the following data-driven insights, "
        "provide 5-7 short, actionable business recommendations.\n"
    ]

    for ins in insights.get("structured_insights", []):
        t = ins.get("type", "")
        if t == "combo":
            items = " + ".join(ins["items"])
            lines.append(f"- Customers frequently order {items} together (support={ins.get('support', 'N/A')}).")
        elif t == "peak_hour":
            h = ins["hour"]
            period = "AM" if h < 12 else "PM"
            display = h if h <= 12 else h - 12
            lines.append(f"- Peak order hour is {display}{period} ({ins.get('order_count', '?')} orders).")
        elif t == "popular_item":
            lines.append(f"- '{ins['item']}' is a top seller ({ins.get('order_count', '?')} orders).")
        elif t == "avg_order_value":
            lines.append(f"- Average order value is ${ins['value']}.")
        elif t == "busiest_day":
            lines.append(f"- {ins['day']} is one of the busiest days ({ins.get('order_count', '?')} orders).")

    lines.append("\nProvide concise, numbered recommendations for the restaurant owner.")
    return "\n".join(lines)


def generate_recommendations(insights: dict) -> dict:
    """
    Send insights to Gemma via Ollama and return recommendations.
    Falls back to structured-insights-only response if Ollama is unavailable.
    """
    prompt = _build_prompt(insights)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        recommendation_text = data.get("response", "")

        result = {
            "source": "gemma:2b",
            "status": "success",
            "recommendations": recommendation_text,
            "structured_insights": insights.get("structured_insights", []),
        }

    except requests.ConnectionError:
        print("  [WARN] Ollama is not running. Falling back to structured insights only.")
        print("  Start Ollama with: ollama serve")
        result = _fallback_recommendations(insights)

    except requests.Timeout:
        print("  [WARN] Ollama request timed out. Falling back to structured insights only.")
        result = _fallback_recommendations(insights)

    except Exception as e:
        print(f"  [WARN] Ollama error: {e}. Falling back to structured insights only.")
        result = _fallback_recommendations(insights)

    # Save to cache
    _save_cache(result)
    return result


def _fallback_recommendations(insights: dict) -> dict:
    """Generate basic recommendations from structured insights without LLM."""
    recs = []
    for ins in insights.get("structured_insights", []):
        t = ins.get("type", "")
        if t == "combo":
            items = " + ".join(ins["items"])
            recs.append(f"Create a combo meal deal for {items} -- customers already buy them together.")
        elif t == "peak_hour":
            h = ins["hour"]
            period = "AM" if h < 12 else "PM"
            display = h if h <= 12 else h - 12
            recs.append(f"Staff up at {display}{period} -- this is a peak ordering hour.")
        elif t == "popular_item":
            recs.append(f"Feature '{ins['item']}' prominently on menus -- it's a top seller.")
        elif t == "avg_order_value":
            recs.append(f"Average order is ${ins['value']}. Consider upselling to increase it.")
        elif t == "busiest_day":
            recs.append(f"Prepare extra inventory for {ins['day']} -- it's one of the busiest days.")

    return {
        "source": "fallback (Ollama unavailable)",
        "status": "fallback",
        "recommendations": "\n".join(f"{i+1}. {r}" for i, r in enumerate(recs)),
        "structured_insights": insights.get("structured_insights", []),
    }


def _save_cache(result: dict):
    """Save recommendations to the cache file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(f"  [OK] Recommendations cached -> {CACHE_PATH}")


def load_cached_recommendations() -> dict:
    """Load cached recommendations. Returns empty structure if cache doesn't exist."""
    if not CACHE_PATH.exists():
        return {
            "source": "none",
            "status": "no_cache",
            "recommendations": "No AI recommendations available. Run the training pipeline first.",
            "structured_insights": [],
        }
    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    from backend.ai_engine.insight_engine import load_insights
    insights = load_insights()
    if not insights.get("structured_insights"):
        print("No insights found. Run the training pipeline first.")
    else:
        result = generate_recommendations(insights)
        print(f"\nSource: {result['source']}")
        print(f"Status: {result['status']}")
        print(f"\n{result['recommendations']}")
