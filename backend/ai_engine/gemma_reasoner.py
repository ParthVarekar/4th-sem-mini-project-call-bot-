"""
Gemma Reasoning Layer
Sends structured insights to local Ollama (gemma3:1b) for business recommendations.
Falls back gracefully if Ollama is not available.
"""

import json
import requests
from pathlib import Path

from backend.ai_engine.sentiment_model import analyze_orders_sentiment

DATA_DIR = Path(__file__).parent.parent / "data"
CACHE_PATH = DATA_DIR / "ai_recommendations_cache.json"

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3:1b"


def _build_prompt(insights: dict) -> str:
    """Convert structured insights + live sentiment into a prompt for Gemma."""
    # Get live sentiment data
    try:
        sentiment = analyze_orders_sentiment()
    except Exception:
        sentiment = {"positive": 0, "negative": 0, "neutral": 0, "score": 0.0, "total": 0}

    lines = [
        "You are a restaurant business advisor. Based on the following data-driven insights, "
        "return a JSON array of exactly 6 insight objects.\n",
        "Each object MUST have these keys:",
        '  - "title": short headline (max 8 words)',
        '  - "category": one of "combo", "operations", "loyalty", "product", "issue", "growth"',
        '  - "description": 2-3 sentence actionable recommendation',
        '  - "metric": a relevant number or percentage\n',
    ]

    # Sentiment context
    lines.append(f"Customer Sentiment: {sentiment.get('positive', 0)} positive, "
                 f"{sentiment.get('negative', 0)} negative, {sentiment.get('neutral', 0)} neutral, "
                 f"overall score {sentiment.get('score', 0.0)}.")

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

    lines.append("\nReturn ONLY the JSON array, no other text.")
    return "\n".join(lines)


def _parse_insight_cards(raw_text: str) -> list:
    """Attempt to extract a JSON array of insight cards from Ollama output."""
    import re
    # Try to find a JSON array in the text
    match = re.search(r'\[.*\]', raw_text, re.DOTALL)
    if match:
        try:
            cards = json.loads(match.group(0))
            if isinstance(cards, list) and len(cards) > 0:
                return cards
        except json.JSONDecodeError:
            pass
    return []


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

        # Try to parse structured insight cards
        insight_cards = _parse_insight_cards(recommendation_text)

        result = {
            "source": OLLAMA_MODEL,
            "status": "success",
            "recommendations": recommendation_text,
            "insight_cards": insight_cards if insight_cards else _fallback_insight_cards(insights),
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


def _fallback_insight_cards(insights: dict) -> list:
    """Generate structured insight cards without LLM."""
    try:
        sentiment = analyze_orders_sentiment()
    except Exception:
        sentiment = {"positive": 0, "negative": 0, "neutral": 0, "score": 0.0}

    cards = []
    for ins in insights.get("structured_insights", []):
        t = ins.get("type", "")
        if t == "combo" and len(cards) < 6:
            items = " + ".join(ins["items"])
            cards.append({
                "title": f"Bundle {items}",
                "category": "combo",
                "description": f"Customers frequently order {items} together. Create a combo deal to boost average order value and encourage repeat purchases.",
                "metric": f"Support: {ins.get('support', 'N/A')}"
            })
        elif t == "peak_hour" and len(cards) < 6:
            h = ins["hour"]
            period = "AM" if h < 12 else "PM"
            display = h if h <= 12 else h - 12
            cards.append({
                "title": f"Staff Up at {display}{period}",
                "category": "operations",
                "description": f"Peak ordering hour is {display}{period} with {ins.get('order_count', '?')} orders. Ensure full staff coverage and pre-prep popular items to reduce wait times.",
                "metric": f"{ins.get('order_count', '?')} orders"
            })
        elif t == "popular_item" and len(cards) < 6:
            cards.append({
                "title": f"Promote {ins['item']}",
                "category": "product",
                "description": f"'{ins['item']}' is a top performer with {ins.get('order_count', '?')} orders. Feature it prominently in menus and pair with underperforming items.",
                "metric": f"{ins.get('order_count', '?')} orders"
            })
        elif t == "avg_order_value" and len(cards) < 6:
            cards.append({
                "title": "Increase Average Order",
                "category": "growth",
                "description": f"Average order value is ${ins['value']}. Introduce add-on suggestions at checkout and premium menu tiers to lift this metric.",
                "metric": f"${ins['value']}"
            })

    # Always add sentiment card
    score = sentiment.get('score', 0)
    score_pct = round(score * 100, 1)
    if score < -0.1:
        desc = f"Customer sentiment is negative at {score_pct}%. Investigate recent complaints, improve service speed, and consider a satisfaction recovery campaign."
        cat = "issue"
    elif score > 0.1:
        desc = f"Customer sentiment is positive at {score_pct}%. Leverage happy customers for referrals and reviews. Consider a loyalty program expansion."
        cat = "loyalty"
    else:
        desc = f"Customer sentiment is neutral at {score_pct}%. Look for ways to delight customers and move the needle with surprise upgrades or follow-up calls."
        cat = "issue"
    cards.append({
        "title": "Customer Sentiment Alert",
        "category": cat,
        "description": desc,
        "metric": f"{score_pct}%"
    })

    # Add loyalty card
    cards.append({
        "title": "Loyalty Tier Review",
        "category": "loyalty",
        "description": "Only 2% of customers reach Platinum tier. Consider creating mid-tier rewards to keep Silver and Gold members engaged and progressing.",
        "metric": "2% Platinum"
    })

    return cards[:6]


def _fallback_recommendations(insights: dict) -> dict:
    """Generate basic recommendations from structured insights without LLM."""
    cards = _fallback_insight_cards(insights)
    recs = [f"{i+1}. {c['title']}: {c['description']}" for i, c in enumerate(cards)]

    return {
        "source": "fallback (Ollama unavailable)",
        "status": "fallback",
        "recommendations": "\n".join(recs),
        "insight_cards": cards,
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
