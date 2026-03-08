from flask import Blueprint, jsonify, request

from backend.services.app_state import append_chat_message, get_chat_history
from backend.services.manager_chat import process_manager_query
from backend.utils.response import error_response, success_response

voice_bp = Blueprint('voice', __name__)


@voice_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id', 'default_session')
    user_message = (data.get('message') or '').strip()

    if not user_message:
        payload, status_code = error_response('Message is required', 400)
        return jsonify(payload), status_code

    try:
        history = get_chat_history(session_id)
        ai_response = process_manager_query(user_message, history)
        append_chat_message(session_id, 'user', user_message)
        assistant_content = (
            ai_response.get('reply')
            or ai_response.get('analysis')
            or ai_response.get('recommendation')
            or ''
        )
        updated_history = append_chat_message(
            session_id,
            'assistant',
            assistant_content,
            payload=ai_response,
        )
        return jsonify(
            success_response(
                {
                    'response': ai_response,
                    'session_id': session_id,
                    'history': updated_history,
                }
            )
        )
    except Exception:
        payload, status_code = error_response('Failed to process manager query', 500)
        return jsonify(payload), status_code


@voice_bp.route('/history/<session_id>', methods=['GET'])
def get_history(session_id):
    history = get_chat_history(session_id)
    normalized_history = []
    for message in history:
        payload = message.get('payload') or {}
        normalized_history.append(
            {
                **message,
                'content': payload.get('reply') or message.get('content', ''),
            }
        )
    return jsonify(success_response({'session_id': session_id, 'messages': normalized_history}, count=len(normalized_history)))
