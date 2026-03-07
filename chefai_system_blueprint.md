# ChefAI Dashboard — Complete System Blueprint

This document specifies the technical architecture, data models, and integration paths for the ChefAI Dashboard.

## 1. Frontend Component Map
(See `project_context_summary_full.md` for full hierarchy)
- **Persistent Shell**: `Layout.tsx` handles state for `activeTab` and the AI Sidebar Chatbot.
- **Views**: Dashboard, Analytics, Transcripts, Insights, Rewards, ComboMeals, HolidaySchedule, Settings.

---

## 2. Backend API Contracts & Response Standards

### Response Normalization
All backend JSON responses MUST follow this structure:
```json
{
  "status": "success" | "error",
  "data": {} | [],
  "message": "Optional message (mostly for errors)",
  "meta": {
    "count": 42,
    "timestamp": "2026-03-08T..."
  }
}
```

### Core API Endpoints
| Endpoint | Method | Response Data Key | Description |
| :--- | :--- | :--- | :--- |
| `/api/ai/insights` | `GET` | `structured_insights`, `recommendations` | AI Engine output |
| `/api/analytics` | `GET` | `volume`, `peaks`, `trends` | Chart data aggregation |
| `/api/dashboard/stats` | `GET` | `kpis`, `weekly_orders` | Dashboard summary |
| `/api/orders` | `GET` | `orders` | Transaction list from CSV |
| `/api/rewards` | `GET` | `customers` | Loyalty program data |
| `/api/combos` | `GET` | `combos` | Managed combo meals |
| `/voice/chat` | `POST` | `response` | Live chatbot interaction |

---

## 3. Chart Data Schemas (Recharts)

| Component | Chart Type | Schema |
| :--- | :--- | :--- |
| **Weekly Orders** | `BarChart` | `[ { "name": "Mon", "orders": 40 } ]` |
| **Regional Activity** | `PieChart` | `[ { "name": "Dine-in", "value": 66 } ]` |
| **Call Volume** | `AreaChart` | `[ { "time": "08:00", "calls": 12 } ]` |
| **Peak Hours** | `BarChart` | `[ { "day": "Mon", "morning": 40, "evening": 90 } ]` |
| **Order Trends** | `LineChart` | `[ { "name": "Week 1", "orders": 150, "revenue": 4500 } ]` |

---

## 4. Frontend API Service Architecture

Located in `frontend/src/app/services/`.

- **`apiClient.ts`**: Base Axios configuration.
- **`analyticsService.ts`**: `fetchCallAnalytics()`, `fetchOrderTrends()`.
- **`ordersService.ts`**: `fetchDashboardKPIs()`, `fetchWeeklyOrders()`.
- **`rewardsService.ts`**: `fetchLoyaltyCustomers()`.
- **`comboService.ts`**: `fetchComboMeals()`, `updateCombo()`.
- **`holidayService.ts`**: `fetchHolidaySchedule()`.
- **`aiInsightsService.ts`**: `fetchAIGrowthInsights()`.
- **`chefAiService.ts`**: Refactored to bridge Chatbot UI with `/voice/chat`.

---

## 5. Dashboard KPI Definitions

| KPI | Source / Formula | Target Element |
| :--- | :--- | :--- |
| **Total Orders** | `count(orders.csv)` | KPI Card |
| **Total Revenue** | `sum(orders.csv[price])` | KPI Card / Chart |
| **Dine-in %** | `(dine_in_count / total_orders) * 100` | PieChart |
| **Avg Order Value** | `total_revenue / total_orders` | KPI Card / Insights |
| **Peak Load** | `max(hourly_volume)` | Analytics Hero |

---

## 6. AI Insight → UI Mapping

| Insight Type | UI Location | Visual Representation |
| :--- | :--- | :--- |
| **`combo`** | Combo Meals / Insights | Suggested deal card |
| **`peak_hour`** | Analytics / Holiday | Schedule annotation / Red Alert |
| **`popular_item`** | Dashboard | "Menu Performance" top item |
| **`avg_order_value`** | Dashboard / Insights | "Growth" metric arrow |
| **`busiest_day`** | Analytics | Chart highlighting |

---

## 7. Mock Data & Injection Roadmap
(See `project_context_summary_full.md` for full inventory)
1. **Phase 1**: Implement `apiClient.ts` and `analyticsService.ts`.
2. **Phase 2**: Replace `weeklyOrdersData` in `Dashboard.tsx` with API call.
3. **Phase 3**: Replace `volumeData` in `Analytics.tsx` with API call.
4. **Phase 4**: Connect `Insights.tsx` to `ai_recommendations_cache.json`.
