from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/status', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "call-bot-backend"}), 200
