"""
AI Routes - Flask Blueprint
Exposes GET /api/ai/insights which returns cached AI recommendations.
Does NOT run any models - only reads the pre-computed cache.
"""

from flask import Blueprint, jsonify

from backend.utils.response import success_response

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/api/ai/insights", methods=["GET"])
def get_ai_insights():
    """Return cached AI recommendations."""
    from backend.ai_engine.gemma_reasoner import load_cached_recommendations

    data = load_cached_recommendations()
    return jsonify(success_response(data))
