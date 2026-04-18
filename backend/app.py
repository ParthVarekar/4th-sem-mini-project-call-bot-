from flask import Flask
from flask_cors import CORS

from backend.config import BUSINESS_PHONE
from backend.routes.ai_routes import ai_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.health import health_bp
from backend.routes.voice import voice_bp

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}})

app.register_blueprint(voice_bp, url_prefix='/voice')
app.register_blueprint(health_bp, url_prefix='/health')
app.register_blueprint(ai_bp)
app.register_blueprint(dashboard_bp)


@app.route('/')
def home():
    return {
        'service': 'chefai-backend',
        'businessPhone': BUSINESS_PHONE,
        'health': '/health',
    }


if __name__ == '__main__':
    app.run(debug=True, port=5000)
