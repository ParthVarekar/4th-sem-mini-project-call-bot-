# ChefAI Operational Startup Procedure

## 1. Overview
ChefAI consists of three required services that must run simultaneously:

*   **Flask backend** (API + data processing)
*   **React/Vite frontend** (dashboard UI)
*   **Ollama LLM server** (Gemma model for chatbot intelligence)

The application will not function correctly if any of these services are missing. Ollama is a **required dependency**. The system must not be considered operational unless Ollama is running and responding.

## 2. System Architecture
The runtime flow operates as follows:

```
Frontend UI (port 6969)
↓
Backend API (port 5000)
↓
CSV data + local state storage
↓
Ollama LLM (port 11434)
```

The backend communicates with Ollama's local API to generate AI chatbot responses.

## 3. Required Services (MANDATORY)
The following services must be running simultaneously:

| Service | Port | Purpose |
| :--- | :--- | :--- |
| **Ollama** | 11434 | AI model runtime |
| **Flask Backend** | 5000 | API + chatbot routing |
| **Vite Frontend** | 6969 | User interface |

## 4. Prerequisites
Ensure the following software is installed on the host machine:

*   Python 3.10+
*   Node.js 18+
*   npm
*   Ollama installed locally

Ensure Ollama is installed and available in your system `PATH`.

## 5. First-Time Setup

### Backend Setup
1. Navigate to the project root:
   ```bash
   cd project_root
   ```
2. Create the virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the environment (Windows PowerShell example):
   ```powershell
   .venv\Scripts\Activate.ps1
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```

## 6. Starting the Full Stack
For convenience on Windows machines, a `start_all.ps1` script is provided in the root directory. Right-click and run it with PowerShell, or execute `.\start_all.ps1` to instantly boot all three services into background windows.

If you prefer to start them manually, three separate terminals must be used to run the stack:

### TERMINAL 1 — Start Ollama (MANDATORY)
Start the Ollama server:
```bash
ollama serve
```
Ensure the required model exists by pulling it (in another terminal or before running `serve` if it runs as a background service):
```bash
ollama pull gemma3:1b
```
Verify the model is ready:
```bash
ollama list
```
*Note: The Ollama server must be running before starting the backend.*

### TERMINAL 2 — Start Backend API
1. Navigate to the project root.
2. Activate the virtual environment.
3. Run the backend server:
   ```bash
   python run.py
   ```
The backend should start at: `http://localhost:5000`

### TERMINAL 3 — Start Frontend UI
1. Navigate to the frontend directory.
2. Run the Vite development server:
   ```bash
   npm run dev
   ```
The frontend will start at: `http://localhost:6969`

## 7. Verifying Services
Open the application in a browser at `http://localhost:6969`.

Login using any email/password (mock authentication). Verify that the following pages load and display live data:

*   Dashboard
*   Analytics
*   Insights
*   Transcripts
*   Rewards
*   Combo Meals
*   Holiday Schedule
*   Settings

## 8. API Health Checks
Test these endpoints to confirm backend health:

*   `http://localhost:5000/health`
*   `http://localhost:5000/api/dashboard/stats`
*   `http://localhost:5000/api/analytics`
*   `http://localhost:5000/voice/chat`

Expected response example from `/health`:
```json
{
  "status": "healthy",
  "dependencies": {
    "dataFilesReady": true,
    "ollamaReady": true
  }
}
```
If `ollamaReady` is `false`, the system is not fully operational.

## 9. Data Sources
The backend reads operational data from CSV files located in `backend/data/`:

*   `orders.csv`
*   `call_logs.csv`
*   `customers.csv`
*   `menu_items.csv`

Runtime application state is similarly stored or modeled around files in `backend/data/`. Examples of entities utilizing local storage:

*   transcripts
*   chat history
*   settings
*   combos
*   holidays

## 10. Troubleshooting

### If chatbot responses do not work:
1. Ensure Ollama is running:
   ```bash
   ollama serve
   ```
2. Confirm the exact model is downloaded:
   ```bash
   ollama list
   ```
3. Restart the backend server.

### If API requests fail:
*   Verify the backend is explicitly running on port 5000. Check the console logs for crashes.

### If UI fails to load data:
*   Ensure the backend is reachable and that CORS is functioning properly in `app.py`. Check the browser network tab for 500 errors or CORS blocks.

## 11. Expected Running State
When the system is fully operational:

*   Ollama server running on port `11434`
*   Flask backend running on port `5000`
*   React frontend running on port `6969`
*   Health endpoint reports `"ollamaReady": true`
*   Chatbot produces AI-generated responses based on business context
*   Dashboard loads real analytics data from the local data files
