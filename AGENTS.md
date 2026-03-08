# AGENTS.md

## Project
ChefAI Dashboard combines a Flask backend in `backend/` with a React + Vite frontend in `frontend/`.

## Backend
Run from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

The backend listens on `http://127.0.0.1:5000` by default.

## Frontend
Run from `frontend/`:

```powershell
npm install
npm run dev
```

The frontend listens on `http://127.0.0.1:5173` by default.

## Environment Variables
Use `.env.example` as the template.

Required or supported variables:

- `OLLAMA_URL`: Ollama generate endpoint. Defaults to `http://localhost:11434/api/generate`.
- `OLLAMA_MODEL`: Ollama model name used by the manager chatbot. Defaults to `gemma3:1b`.
- `VITE_API_URL`: frontend API base URL. Defaults to `http://127.0.0.1:5000`.

## Tests
Run backend tests from the project root:

```powershell
python -m pytest tests
```

## Build Commands
Frontend production build:

```powershell
cd frontend
npm run build
```

## Notes
- `backend/data/*.json` files are runtime-generated persistence stores for settings, transcripts, chat history, custom combos, custom holidays, and discounts.
- `GET /health` reports data-file readiness and whether Ollama is reachable.
- The chatbot works without Ollama by falling back to deterministic business responses, but Ollama improves answer quality.
