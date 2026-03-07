# Project Context Summary — ChefAI Dashboard

## 1. Frontend Structure
- **Framework**: React + Vite using Tailwind CSS and `lucide-react` for icons. UI components are styled largely with Tailwind and animated with `motion/react`.
- **Component Layout**: The main layout is controlled by `Layout.tsx` which contains the dual-pane sidebar (Navigation Tabs + Chatbot Widget) and the main content area.
- **Key Views**:
  - `Dashboard.tsx`
  - `Analytics.tsx`
  - `Transcripts.tsx`
  - `Insights.tsx` (Currently fetching data from `/api/ai/insights`)
  - `Rewards.tsx`
  - `ComboMeals.tsx`
  - `HolidaySchedule.tsx`
  - `Settings.tsx`
- **Data Flow & State Management**: State is largely local React state (`useState`, `useEffect`). Global navigation state (`activeTab`) is hosted in `App.tsx` and distributed via props. `chefAiService.ts` handles API calls to local endpoints and fallback mock data. The AI chatbot uses an intent-based local fallback combined with a Gemma AI backend route.
- **Where Data Comes From Currently**:
  - Chatbot: Uses local Gemma instance via Ollama (`http://localhost:11434/api/generate`) with structured data injected from `mockData.ts`.
  - Insights: Calls `http://127.0.0.1:5000/api/ai/insights`.
  - Others (Analytics, Combo Meals, Rewards): Predominantly static/mock UI layouts lacking real data bindings.

## 2. Backend Structure
- **Framework**: Flask (running on port 5000 via `run.py`).
- **Endpoints**:
  - `/api/callbot` (Handles phone agent inputs)
  - `/api/ai/insights` (Returns mock Apriori combo analysis and real-time structured data cached by `ai_engine`)
- **AI Engine (`backend/ai_engine/`)**: 
  - Modules such as `gemma_reasoner.py`, `feature_engineering.py`, `insight_merger.py` and automated training scripts.
  - Data Sources: CSVs located in `backend/data/` (e.g., `menu_items.csv`, `orders.csv`, `ai_structured_insights.json`).

## 3. UI Components to Become Reactive
The following components need to fetch dynamic backend data instead of relying on hardcoded UI states:
- `Analytics.tsx` -> Should fetch from `/api/analytics` or `/api/orders`
- `Insights.tsx` -> Already partially reactive to `/api/ai/insights`, but needs full integration for rendering the UI charts.
- `Rewards.tsx` -> Should fetch loyalty / repeat customer stats
- `ComboMeals.tsx` -> Should fetch real active combo packages from DB
- `HolidaySchedule.tsx` -> Should fetch events and open/close status
- `Dashboard.tsx` -> Should fetch top-level KPI metrics (revenue, orders, dine-in stats)
