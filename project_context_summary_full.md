# ChefAI Dashboard — Full Project Context Summary

This document serves as the comprehensive technical blueprint for making the ChefAI Dashboard reactive to backend data and AI model outputs.

## 1. Frontend Component Map

The application follows a standard modular React architecture managed with Vite and styled with Tailwind CSS + Shadcn UI.

### Component Hierarchy
- **`App.tsx` (Root)**
  - `Login.tsx` (Auth Gate)
  - `Layout.tsx` (Persistent Shell)
    - **Sidebar**
      - Navigation Menu (`navItems` array)
      - ChefAI Assistant Chatbot (`ChatMessage` array + `processMessage` service)
    - **Header** (Live Sync status, Notifications, User Profile)
    - **Page Views** (Active Tab state)

### Page-Level Data Usage
| Page | Data Components | Chart/UI Elements | Key Data Fields |
| :--- | :--- | :--- | :--- |
| **Dashboard** | KPI Cards, BarChart, PieChart | Weekly Orders, Regional Activity | `day`, `orders`, `location`, `value` |
| **Analytics** | AreaChart, BarChart, LineChart | Call Volume, Peak Hours, Order Trends | `time`, `calls`, `revenue`, `orders` |
| **Transcripts** | List, Conversation Bubbles | Phone Call Logs | `customer`, `duration`, `transcript` |
| **Insights** | Action Cards, Detail Views | AI Recommendations | `title`, `impact`, `category`, `recommendation` |
| **Rewards** | Table, Progress | Loyalty Program | `name`, `points`, `tier`, `discount` |
| **Combo Meals** | Grid, Modal | Combo Management | `name`, `items`, `price`, `popular` |
| **Holiday Schedule** | Calendar, Alert | Event Tracking | `date`, `event`, `staffing_tip` |

---

## 2. Backend API Contracts

Currently implemented routes in `backend/app.py`:

### AI Insights
- **Endpoint**: `GET /api/ai/insights`
- **Controller**: `ai_routes.py`
- **Description**: Returns pre-computed AI recommendations from the cache.
- **Sample Response**:
```json
{
  "source": "gemma3:1b",
  "status": "success",
  "recommendations": "...",
  "structured_insights": [
    { "type": "combo", "items": ["Burger", "Fries"], "support": 0.17 },
    { "type": "peak_hour", "hour": 19, "order_count": 567 }
  ]
}
```

### Callbot Chat
- **Endpoint**: `POST /voice/chat`
- **Payload**: `{ "session_id": "string", "message": "string" }`
- **Response**: `{ "response": "string", "session_id": "string" }`
- **Logic**: Handles session history and extracts appointment/order data to Excel.

### Future API Requirements
The following endpoints are needed for full reactivity:
- `GET /api/analytics` (Volume/Trends)
- `GET /api/orders` (Recent/Weekly)
- `GET /api/rewards` (Customer list)
- `GET /api/combos` (Current meal deals)
- `GET /api/holidays` (Calendar events)

---

## 3. AI Insight Schema

Located in `backend/data/ai_structured_insights.json` and `ai_recommendations_cache.json`.

### Structured Insight Types
- **Combo**: `{"type": "combo", "items": string[], "support": float, "confidence": float}`
- **Peak Hour**: `{"type": "peak_hour", "hour": int, "order_count": int}`
- **Popular Item**: `{"type": "popular_item", "item": string, "order_count": int}`
- **Avg Order Value**: `{"type": "avg_order_value", "value": float}`
- **Busiest Day**: `{"type": "busiest_day", "day": string, "order_count": int}`

---

## 4. Backend Data Models

Primary datasets stored as CSV files in `backend/data/`:

### `orders.csv`
- **Fields**: `order_id` (int), `timestamp` (datetime), `items` (pipe-separated strings), `price` (float), `customer_id` (int).
- **Relationships**: Linked to `customers.csv` via `customer_id`.

### `menu_items.csv`
- **Fields**: `item_id` (int), `name` (string), `price` (float), `category` (string).

### `customers.csv`
- **Fields**: `customer_id` (int), `name` (string), `email` (string).

---

## 5. Chatbot Data Flow

1. **User Input**: Captured in `Layout.tsx` and passed to `chefAiService.ts:processMessage`.
2. **Service Layer**: 
   - Checks local cache (5-min TTL).
   - Attempts Ollama (Gemma Model) call.
   - Falls back to **Local Pattern Matching** if Ollama is unavailable.
3. **Intent Detection**: Keywords map user queries to intents (`menu`, `combo`, `reservation`).
4. **Data Injected**: `mockData.ts` (currently) provides the structured data for chat bubbles (e.g., `MenuDataView`).
5. **UI Rendering**: `ChatDataRenderer` in `Layout.tsx` picks the visual component based on the `intent`.

---

## 6. Analytics Data Requirements

### Daily Call Volume
- **Needs**: Hourly call counts derived from call logs (yet to be created in backend).
- **Chart**: `AreaChart` with `time` and `calls`.

### Peak Hours
- **Needs**: Comparison of day vs night shifts or morning vs evening peaks.
- **Fields**: `day`, `morning_count`, `evening_count`.

### Order Value Trends
- **Needs**: Weekly revenue and order count aggregation.
- **Fields**: `period_name`, `orders_count`, `revenue_amount`.

---

## 7. Mock Data Inventory

| Location | Usage | Current Data Source |
| :--- | :--- | :--- |
| `mockData.ts` | Menu, Combos, Specials, Reservations | Static exported constants |
| `Dashboard.tsx` | Chart data, Loyalty list, Pantry | Internal hardcoded arrays |
| `Analytics.tsx` | Volume, Peak, Trend charts | Internal hardcoded arrays |
| `chefAiService.ts` | Gemma System Prompt | Hardcoded menu text |

---

## 8. UI Data Injection Points

Marked with `// TODO: Fetch...` in the following components:
- `Dashboard.tsx`: Line 30
- `Analytics.tsx`: Line 72
- `Rewards.tsx`: Line 69 (approx)
- `ComboMeals.tsx`: Line 130
- `HolidaySchedule.tsx`: Line 111
- `Insights.tsx`: Line 140

All data fetching should be moved to `chefAiService.ts` or individual per-page services using `axios` or `fetch` calls to the Flask backend.
