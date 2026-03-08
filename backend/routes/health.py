import json
import os
from pathlib import Path

import requests
from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)
DATA_DIR = Path(__file__).resolve().parents[1] / 'data'
CACHE_PATH = DATA_DIR / 'ai_recommendations_cache.json'
OLLAMA_TAGS_URL = os.getenv('OLLAMA_TAGS_URL', 'http://localhost:11434/api/tags')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'gemma3:1b')
REQUIRED_DATA_FILES = [
    'orders.csv',
    'call_logs.csv',
    'customers.csv',
    'menu_items.csv',
]


def _ollama_status() -> dict:
    try:
        response = requests.get(OLLAMA_TAGS_URL, timeout=2)
        response.raise_for_status()
        model_names = [model.get('name') for model in response.json().get('models', [])]
        return {
            'serverReachable': True,
            'modelAvailable': OLLAMA_MODEL in model_names,
            'configuredModel': OLLAMA_MODEL,
            'availableModels': model_names,
        }
    except Exception:
        return {
            'serverReachable': False,
            'modelAvailable': False,
            'configuredModel': OLLAMA_MODEL,
            'availableModels': [],
        }


def _insights_cache_status() -> dict:
    if not CACHE_PATH.exists():
        return {
            'exists': False,
            'ready': False,
            'source': 'none',
            'status': 'missing',
        }

    try:
        payload = CACHE_PATH.read_text(encoding='utf-8')
        if not payload.strip():
            return {
                'exists': True,
                'ready': False,
                'source': 'none',
                'status': 'empty',
            }

        cached = json.loads(payload)
        recommendations = str(cached.get('recommendations', '')).strip()
        source = cached.get('source', 'unknown')
        cache_ready = bool(recommendations)
        return {
            'exists': True,
            'ready': cache_ready,
            'source': source,
            'status': cached.get('status', 'unknown'),
        }
    except Exception:
        return {
            'exists': True,
            'ready': False,
            'source': 'unknown',
            'status': 'invalid',
        }


@health_bp.route('', methods=['GET'])
@health_bp.route('/', methods=['GET'])
@health_bp.route('/status', methods=['GET'])
def health_check():
    existing_files = [name for name in REQUIRED_DATA_FILES if (DATA_DIR / name).exists()]
    missing_files = [name for name in REQUIRED_DATA_FILES if name not in existing_files]
    ollama = _ollama_status()
    insights_cache = _insights_cache_status()
    dependencies = {
        'dataFilesReady': len(missing_files) == 0,
        'ollamaReady': ollama['serverReachable'],
        'chatModelReady': ollama['modelAvailable'],
        'insightsCacheReady': insights_cache['ready'],
        'reasoningReady': ollama['serverReachable'] and ollama['modelAvailable'],
    }
    payload = {
        'status': 'healthy' if all(dependencies.values()) else 'degraded',
        'service': 'chefai-backend',
        'dependencies': dependencies,
        'data': {
            'presentFiles': existing_files,
            'missingFiles': missing_files,
            'ollama': ollama,
            'insightsCache': insights_cache,
        },
    }
    return jsonify(payload), 200 if payload['status'] == 'healthy' else 503
