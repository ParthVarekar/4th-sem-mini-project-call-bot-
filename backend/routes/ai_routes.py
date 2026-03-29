"""
AI Routes - Flask Blueprint
Exposes:
  GET  /api/ai/insights          — cached Gemma recommendations
  POST /api/ai/sentiment         — single-text sentiment prediction
  GET  /api/ai/sentiment/batch   — batch analysis over transcripts / comments
"""

from flask import Blueprint, jsonify, request

from backend.utils.response import success_response, error_response

ai_bp = Blueprint("ai", __name__)


# ── Existing route (untouched) ────────────────────────────────────────────
@ai_bp.route("/api/ai/insights", methods=["GET"])
def get_ai_insights():
    """Return cached AI recommendations."""
    from backend.ai_engine.gemma_reasoner import load_cached_recommendations

    data = load_cached_recommendations()
    return jsonify(success_response(data))


# ── Single-text sentiment ────────────────────────────────────────────────
@ai_bp.route("/api/ai/sentiment", methods=["POST"])
def predict_sentiment_route():
    """
    POST /api/ai/sentiment
    Body: { "text": "customer review" }
    Returns: { "sentiment": "POSITIVE", "confidence": 0.98 }
    """
    body = request.get_json(silent=True)
    if not body or "text" not in body:
        return jsonify(error_response("Missing 'text' field in request body", 400))

    text = body["text"]
    if not isinstance(text, str) or not text.strip():
        return jsonify(error_response("'text' must be a non-empty string", 400))

    from backend.ai_engine.sentiment_model import predict_sentiment

    result = predict_sentiment(text)
    return jsonify(success_response({
        "sentiment": result["label"],
        "confidence": result["score"],
    }))


# ── Batch sentiment analysis ─────────────────────────────────────────────
@ai_bp.route("/api/ai/sentiment/batch", methods=["GET"])
def batch_sentiment_route():
    """
    GET /api/ai/sentiment/batch
    Returns aggregated sentiment stats from transcripts.json or comments.csv.
    """
    from backend.ai_engine.sentiment_model import analyze_orders_sentiment

    result = analyze_orders_sentiment()
    return jsonify(success_response(result))
