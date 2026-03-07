from flask import Flask
from flask_cors import CORS
from backend.config import BUSINESS_PHONE
from backend.routes.voice import voice_bp
from backend.routes.health import health_bp
from backend.routes.ai_routes import ai_bp
from backend.routes.dashboard import dashboard_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Register Blueprints
app.register_blueprint(voice_bp, url_prefix='/voice')
# app.register_blueprint(health_bp, url_prefix='/health') # Commented out until implemented
app.register_blueprint(ai_bp)  # AI insights endpoint at /api/ai/insights
app.register_blueprint(dashboard_bp)

@app.route('/')
def home():
    return f"Call Bot Backend Active. Business Phone: {BUSINESS_PHONE}"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
