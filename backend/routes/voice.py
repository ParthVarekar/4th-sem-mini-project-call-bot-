from flask import Blueprint, request, jsonify
from backend.services.manager_chat import process_manager_query
from backend.utils.response import success_response, error_response
import traceback

voice_bp = Blueprint('voice', __name__)

@voice_bp.route('/chat', methods=['POST'])
def chat():
    """
    Manager Intelligence Assistant Chat Endpoint.
    """
    data = request.json
    session_id = data.get("session_id", "default_session")
    user_message = data.get("message", "")

    if not user_message:
        return jsonify(error_response("Message is required")[0]), 400

    try:
        ai_response = process_manager_query(user_message)
        return jsonify(success_response({"response": ai_response, "session_id": session_id}))
    except Exception as e:
        print(f"[X] Chat Endpoint Failed: {e}")
        traceback.print_exc()
        return jsonify(error_response("Failed to process manager query", 500)[0]), 500

@voice_bp.route('/history/<session_id>', methods=['GET'])
def get_history(session_id):
    # History isn't heavily used in the new stateless AI requests yet, 
    # but we retain the route layout if needed by UI
    return jsonify([])
