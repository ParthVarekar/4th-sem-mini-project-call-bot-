import json
import os
import re
from typing import Any

import requests

from backend.services.analytics import get_business_context
from backend.services.app_state import (
    get_combo_catalog,
    get_discount_catalog,
    get_holiday_events,
    get_settings,
)
from backend.services.data_loader import load_customers

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:1b")
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "60"))
OLLAMA_MAX_TOKENS = int(os.getenv("OLLAMA_MAX_TOKENS", "160"))

INTENT_KEYWORDS = {
    "customer_sentiment": ["sentiment", "feel", "reviews", "review", "satisfaction"],
    "financial_analysis": ["revenue", "sales", "finance", "money", "profit"],
    "menu_performance": ["menu", "item", "dish", "popular", "best", "worst"],
    "combo_recommendation": ["combo", "bundle", "meal", "upsell"],
    "customer_rewards": ["reward", "loyalty", "point", "vip", "discount"],
    "discount_strategy": ["discount", "coupon", "offer", "promotion"],
    "peak_hours_analysis": ["peak", "hour", "rush", "busy", "traffic"],
    "customer_insights": ["customer", "guest", "retention", "repeat"],
    "marketing_recommendations": ["marketing", "campaign", "promo", "advertise"],
    "operational_recommendations": ["staff", "schedule", "operation", "inventory", "pantry"],
    "dashboard_help": ["dashboard", "tab", "screen", "help", "where"],
}

META_OPENERS = (
    "the user is asking",
    "based on the query",
    "the user wants to know",
    "the question is about",
    "the user is requesting",
)

STRATEGY_TERMS = (
    "how can",
    "how do i",
    "what should",
    "recommend",
    "strategy",
    "increase",
    "improve",
    "boost",
    "promote",
    "fix",
    "grow",
)

CHEFAI_SYSTEM_PROMPT = """
You are ChefAI, an AI restaurant operations and growth advisor.

You assist restaurant owners, managers, and operators in making better decisions about their business.

Your expertise includes:
- restaurant revenue optimization
- menu engineering
- customer behavior analysis
- promotions and marketing strategies
- operations efficiency
- upselling and combo design
- holiday demand patterns
- restaurant analytics and KPIs

Your goal is to provide clear, intelligent, practical answers related to restaurant operations.

Response style:
- Answer the user's question directly and clearly first.
- Use simple, professional language.
- Do not use meta phrases like "The user is asking" or "Based on the query".
- Do not force suggestions if the user only asked for information.
- If suggestions help, include them naturally.
- For explanation questions, explain customer behavior clearly.
- For strategy questions, give practical actions.
- For data questions, explain what the metric means for the business.
- If information is limited, say so clearly.
""".strip()


def detect_intent_deterministic(query: str) -> str:
    lowered = query.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return intent
    return "general_question"


def _classify_question_style(query: str, intent: str) -> str:
    lowered = query.lower()
    if lowered.startswith("why") or "why " in lowered or "what does" in lowered or "mean" in lowered:
        return "explanation"
    if any(term in lowered for term in STRATEGY_TERMS):
        return "strategy"
    if intent in {"financial_analysis", "menu_performance", "peak_hours_analysis", "customer_insights"}:
        return "data_interpretation"
    return "general"


def _should_include_recommendation(query: str, intent: str) -> bool:
    lowered = query.lower()
    if any(term in lowered for term in STRATEGY_TERMS):
        return True
    return intent in {
        "combo_recommendation",
        "discount_strategy",
        "marketing_recommendations",
        "operational_recommendations",
    }


def _top_customers(limit: int = 3) -> list[dict[str, Any]]:
    ranked = sorted(load_customers(), key=lambda customer: customer.get("points", 0), reverse=True)
    return [
        {
            "name": customer["name"],
            "tier": customer.get("tier", "Bronze"),
            "points": customer.get("points", 0),
        }
        for customer in ranked[:limit]
    ]


def _compact_combos(limit: int = 3) -> list[dict[str, Any]]:
    return [
        {"name": combo["name"], "items": combo["items"], "price": combo["price"]}
        for combo in get_combo_catalog()[:limit]
    ]


def _discount_snapshot(limit: int = 3) -> list[dict[str, Any]]:
    return [
        {
            "name": discount["name"],
            "value": discount["value"],
            "conditions": discount["conditions"],
        }
        for discount in get_discount_catalog()[:limit]
    ]


def _holiday_snapshot(limit: int = 3) -> list[dict[str, Any]]:
    return [
        {
            "title": holiday["title"],
            "date": holiday["date"],
            "impact": holiday["callVolumeImpact"],
        }
        for holiday in get_holiday_events()[:limit]
    ]


def _extract_json_payload(raw_text: str) -> dict[str, Any]:
    candidate = raw_text.strip()
    if candidate.startswith("```json"):
        candidate = candidate.split("```json", 1)[1].rsplit("```", 1)[0].strip()
    elif candidate.startswith("```"):
        candidate = candidate.split("```", 1)[1].rsplit("```", 1)[0].strip()

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(candidate[start : end + 1])


def _clean_text(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""

    normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    lowered = normalized.lower()
    for opener in META_OPENERS:
        if lowered.startswith(opener):
            parts = normalized.split(". ", 1)
            normalized = parts[1].strip() if len(parts) == 2 else ""
            break

    if normalized.lower().startswith("based on "):
        parts = normalized.split(",", 1)
        normalized = parts[1].strip() if len(parts) == 2 else normalized

    if normalized.lower().startswith("tip:"):
        normalized = normalized[4:].strip()
    if normalized.lower().startswith("recommendation:"):
        normalized = normalized[len("recommendation:") :].strip()
    if normalized:
        normalized = normalized[0].upper() + normalized[1:]
    return normalized


def _extract_string_field(raw_text: str, field_name: str) -> str:
    # Match the field and everything after the quote. The closing quote is optional in case of truncation.
    pattern = rf'"{field_name}"\s*:\s*"((?:\\.|[^"\\])*)'
    match = re.search(pattern, raw_text, flags=re.DOTALL)
    if not match:
        return ""
    
    extracted = match.group(1)
    try:
        return json.loads(f'"{extracted}"')
    except json.JSONDecodeError:
        # If JSON loading fails (e.g., due to an incomplete escape sequence at the end of truncation)
        # we can strip any trailing backslash and try again, or just return it raw.
        if extracted.endswith('\\'):
            extracted = extracted[:-1]
        try:
            return json.loads(f'"{extracted}"')
        except json.JSONDecodeError:
            try:
                # Fallback to safely unescape newlines so ReactMarkdown can work its magic
                return extracted.encode('utf-8').decode('unicode_escape')
            except Exception:
                return extracted


def _normalize_data(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if value in (None, ""):
        return {}
    return {"summary": str(value)}


def _compose_response(
    *,
    intent: str,
    query: str,
    reply: Any,
    data: Any,
    recommendation: Any,
    source: str,
) -> dict[str, Any]:
    clean_reply = _clean_text(reply)
    clean_recommendation = _clean_text(recommendation)

    if not _should_include_recommendation(query, intent):
        clean_recommendation = ""
    elif clean_recommendation and clean_recommendation in clean_reply:
        clean_recommendation = ""

    if not clean_reply and clean_recommendation:
        clean_reply = clean_recommendation
        clean_recommendation = ""

    return {
        "intent": intent or "general_question",
        "reply": clean_reply,
        "analysis": clean_reply,
        "data": _normalize_data(data),
        "recommendation": clean_recommendation,
        "reasoningSource": source,
    }


def _holiday_behavior_fallback(query: str) -> dict[str, Any] | None:
    lowered = query.lower()

    if "valentine" in lowered and "couple" in lowered:
        reply = (
            "Valentine's Day brings couples into restaurants because dining out feels like a special occasion. "
            "People are usually looking for atmosphere, service, and a more memorable experience than they can create at home."
        )
        return _compose_response(
            intent="holiday_demand_patterns",
            query=query,
            reply=reply,
            data={"occasion": "Valentine's Day", "audience": "Couples"},
            recommendation="",
            source="fallback",
        )

    if lowered.startswith("why") and any(term in lowered for term in ["holiday", "anniversary", "festival"]):
        reply = (
            "Holiday traffic is usually driven by occasion-based spending. Guests are more willing to pay for convenience, "
            "celebration, and a stronger dining experience when the date already feels special."
        )
        return _compose_response(
            intent="holiday_demand_patterns",
            query=query,
            reply=reply,
            data={},
            recommendation="",
            source="fallback",
        )

    return None


def local_fallback_response(intent: str, query: str) -> dict[str, Any]:
    context = get_business_context()
    holiday_response = _holiday_behavior_fallback(query)
    if holiday_response is not None:
        return holiday_response

    if intent == "customer_sentiment":
        from backend.ai_engine.sentiment_model import analyze_orders_sentiment
        res = analyze_orders_sentiment()
        score = float(res.get("score", 0.0))
        
        if score > 0.2:
            trend = "up"
        elif score < -0.2:
            trend = "down"
        else:
            trend = "stable"
            
        return _compose_response(
            intent=intent,
            query=query,
            reply=(
                f"Customer sentiment score is {score}. "
                f"There are {res.get('positive', 0)} positive and {res.get('negative', 0)} negative responses. "
                f"Overall trend is {trend}."
            ),
            data={"sentiment": res, "trend": trend},
            recommendation="Review transcripts regularly if the trend shows signs of decline.",
            source="fallback",
        )

    if intent == "financial_analysis":
        return _compose_response(
            intent=intent,
            query=query,
            reply=(
                f"Revenue currently sits at {context['Total Revenue']}, and your average order value is "
                f"{context['Average Order Value']}."
            ),
            data={
                "revenue": context["Total Revenue"],
                "averageOrderValue": context["Average Order Value"],
            },
            recommendation="Focus on raising ticket size with targeted combo suggestions during peak traffic windows.",
            source="fallback",
        )

    if intent == "menu_performance":
        return _compose_response(
            intent=intent,
            query=query,
            reply=(
                f"Your strongest menu items right now are {context['Top Menu Items']}. "
                f"The weakest items are {context['Worst Menu Items']}."
            ),
            data={
                "topItems": context["Top Menu Items"].split(", "),
                "worstItems": context["Worst Menu Items"].split(", "),
            },
            recommendation=(
                "Promote the strongest sellers more aggressively and review whether the weakest items need a bundle or refresh."
            ),
            source="fallback",
        )

    if intent == "combo_recommendation":
        return _compose_response(
            intent=intent,
            query=query,
            reply="Your combo data points to a clear upsell opportunity around your strongest repeat-order patterns.",
            data={"combos": _compact_combos()},
            recommendation=(
                "Highlight your top two combos during dinner hours and route repeat customers toward the highest-margin bundle."
            ),
            source="fallback",
        )

    if intent in {"customer_rewards", "customer_insights"}:
        return _compose_response(
            intent=intent,
            query=query,
            reply="Your highest-value guests are consistent repeat visitors, so they should anchor your retention campaigns.",
            data={"topCustomers": _top_customers()},
            recommendation="Offer a targeted reward to your top tier customers before the weekend rush to increase return visits.",
            source="fallback",
        )

    if intent == "discount_strategy":
        return _compose_response(
            intent=intent,
            query=query,
            reply="Targeted discounts usually outperform blanket promotions because they protect margin while still driving repeat orders.",
            data={"discounts": _discount_snapshot()},
            recommendation=(
                "Keep fixed-value offers for acquisition and percentage offers for repeat guests who already show high spend."
            ),
            source="fallback",
        )

    if intent == "peak_hours_analysis":
        return _compose_response(
            intent=intent,
            query=query,
            reply=f"Your current peak order window is {context['Peak Hours']}.",
            data={"peakHour": context["Peak Hours"]},
            recommendation="Front-load prep and staffing at least one hour before that rush to reduce fulfillment delays.",
            source="fallback",
        )

    if intent == "marketing_recommendations":
        return _compose_response(
            intent=intent,
            query=query,
            reply="Your marketing should follow menu momentum and seasonal demand spikes, not broad one-size-fits-all promotions.",
            data={
                "campaignIdeas": [
                    "Weekend family combo push",
                    "Loyalty reactivation SMS for Gold and Platinum tiers",
                    "Pre-holiday reservation reminders",
                ]
            },
            recommendation=(
                "Send one campaign tied to your strongest combo and one campaign tied to your upcoming holiday traffic window."
            ),
            source="fallback",
        )

    if intent == "operational_recommendations":
        return _compose_response(
            intent=intent,
            query=query,
            reply="Operations improve fastest when staffing, inventory, and holiday planning all follow the same demand signals.",
            data={"holidays": _holiday_snapshot()},
            recommendation="Use the Holiday Schedule and Inventory views together when planning next week so staffing and stock move in sync.",
            source="fallback",
        )

    if intent == "dashboard_help":
        return _compose_response(
            intent=intent,
            query=query,
            reply="The dashboard is wired to live data for analytics, transcripts, combos, holidays, and settings.",
            data={
                "sections": [
                    "Dashboard for high-level revenue and pantry trends",
                    "Analytics for call and order timing patterns",
                    "Transcripts for recent call summaries and call history",
                    "Rewards, Combos, Holidays, and Settings for persisted actions",
                ]
            },
            recommendation="Start on the Dashboard for the daily picture, then drill into Analytics or Transcripts when something needs attention.",
            source="fallback",
        )

    return _compose_response(
        intent="general_question",
        query=query,
        reply=(
            "I can help interpret revenue, menu performance, staffing windows, loyalty opportunities, and dashboard data."
        ),
        data={
            "suggestions": [
                "Ask about revenue trends",
                "Ask which combos should be promoted",
                "Ask which customers deserve a reward",
            ]
        },
        recommendation="",
        source="fallback",
    )


def process_manager_query(query: str, session_history: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    intent = detect_intent_deterministic(query)
    
    if intent == "customer_sentiment":
        return local_fallback_response(intent, query)
        
    question_style = _classify_question_style(query, intent)
    context = get_business_context()
    settings = get_settings()
    history_lines = []
    for item in (session_history or [])[-6:]:
        role = item.get("role", "user")
        content = item.get("content", "")
        history_lines.append(f"{role}: {content}")

    jit_context = ""
    
    try:
        import pandas as pd
        import re
        
        # ── Always include a compact DB summary ──
        try:
            cust_df = pd.read_csv("backend/data/customers.csv")
            tier_counts = cust_df['tier'].value_counts().to_dict()
            jit_context += f"Database Summary: {len(cust_df)} total customers. "
            jit_context += f"Tier distribution: {tier_counts}. "
            jit_context += f"Avg loyalty points: {cust_df['loyalty_points'].mean():.0f}. "
            jit_context += f"Avg total spent: ${cust_df['total_spent'].mean():.2f}.\n"
        except Exception:
            pass
        
        try:
            orders_df = pd.read_csv("backend/data/orders.csv")
            jit_context += f"Total orders: {len(orders_df)}. "
            jit_context += f"Avg order value: ${orders_df['total_price'].mean():.2f}. "
            jit_context += f"Total revenue: ${orders_df['total_price'].sum():.2f}.\n"
        except Exception:
            pass

        try:
            inv_df = pd.read_csv("backend/data/inventory.csv")
            low_stock = inv_df[inv_df['current_stock'] < inv_df['reorder_level']]
            if not low_stock.empty:
                jit_context += f"Low stock alert: {low_stock['ingredient_name'].tolist()}\n"
        except Exception:
            pass

        # ── Targeted lookups for specific entity queries ──
        customer_match = re.search(r'customer\s+\d+', query.lower())
        staff_match = re.search(r'staff\s+\d+|server\s+\d+', query.lower())
        
        if staff_match:
            term = staff_match.group(0).replace('server', 'staff')
            try:
                staff_df = pd.read_csv("backend/data/staff.csv")
                matches = staff_df[staff_df.apply(lambda r: r.astype(str).str.contains(term, case=False).any(), axis=1)]
                if not matches.empty:
                    jit_context += f"Staff Record: {matches.head(1).to_dict('records')}\n"
                    # Also find orders served by this staff member
                    sid = matches.iloc[0].get('server_id')
                    if sid is not None and 'orders_df' in dir():
                        staff_orders = orders_df[orders_df['server_id'] == sid]
                        jit_context += f"This staff member has served {len(staff_orders)} orders totaling ${staff_orders['total_price'].sum():.2f}.\n"
            except Exception:
                pass
                
        if customer_match:
            term = customer_match.group(0)
            try:
                if 'cust_df' not in dir():
                    cust_df = pd.read_csv("backend/data/customers.csv")
                matches = cust_df[cust_df.apply(lambda r: r.astype(str).str.contains(term, case=False).any(), axis=1)]
                if not matches.empty:
                    jit_context += f"Customer Record: {matches.head(1).to_dict('records')}\n"
                    # Also find this customer's recent orders
                    cid = matches.iloc[0].get('customer_id')
                    if cid is not None:
                        try:
                            if 'orders_df' not in dir():
                                orders_df = pd.read_csv("backend/data/orders.csv")
                            cust_orders = orders_df[orders_df['customer_id'] == cid].tail(5)
                            if not cust_orders.empty:
                                jit_context += f"Recent orders by this customer: {cust_orders[['order_id','items','total_price','timestamp']].to_dict('records')}\n"
                        except Exception:
                            pass
            except Exception:
                pass

        # ── Combo lookup if user asks about combos ──
        if any(w in query.lower() for w in ['combo', 'bundle', 'meal deal', 'package']):
            try:
                combo_df = pd.read_csv("backend/data/combo_meals.csv")
                jit_context += f"Available combo meals: {combo_df[['name','price','popularity_score']].to_dict('records')}\n"
            except Exception:
                pass

        # ── Inventory lookup ──
        if any(w in query.lower() for w in ['inventory', 'stock', 'ingredient', 'supply', 'pantry']):
            try:
                if 'inv_df' not in dir():
                    inv_df = pd.read_csv("backend/data/inventory.csv")
                jit_context += f"Current inventory: {inv_df[['ingredient_name','current_stock','reorder_level']].to_dict('records')}\n"
            except Exception:
                pass

    except Exception as e:
        pass

    prompt = f"""Return only valid JSON with keys intent, reply, data, recommendation.
If no recommendation is needed, set recommendation to an empty string.
Keep reply direct, practical, and free of meta commentary.

Question style: {question_style}
Detected intent: {intent}
Total Revenue: {context['Total Revenue']}
Average Order Value: {context['Average Order Value']}
Top Menu Items: {context['Top Menu Items']}
Worst Menu Items: {context['Worst Menu Items']}
Peak Hours: {context['Peak Hours']}
Voice Persona: {settings['voiceType']}
{jit_context}
Recent Conversation: {chr(10).join(history_lines) if history_lines else 'No previous context.'}
User Question: {query}
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "system": CHEFAI_SYSTEM_PROMPT,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.2,
                    "num_predict": OLLAMA_MAX_TOKENS,
                },
            },
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        body = response.json().get("response", "").strip()
        try:
            parsed = _extract_json_payload(body)
            result = _compose_response(
                intent=parsed.get("intent", intent),
                query=query,
                reply=parsed.get("reply") or parsed.get("analysis") or parsed.get("recommendation"),
                data=parsed.get("data", {}),
                recommendation=parsed.get("recommendation", ""),
                source=OLLAMA_MODEL,
            )

            if result["reply"]:
                return result
        except Exception:
            partial_reply = _extract_string_field(body, "reply")
            partial_recommendation = _extract_string_field(body, "recommendation")
            if partial_reply:
                return _compose_response(
                    intent=intent,
                    query=query,
                    reply=partial_reply,
                    data={},
                    recommendation=partial_recommendation,
                    source=OLLAMA_MODEL,
                )

            clean_body = _clean_text(body)
            if clean_body:
                return _compose_response(
                    intent=intent,
                    query=query,
                    reply=clean_body,
                    data={},
                    recommendation="",
                    source=OLLAMA_MODEL,
                )
    except Exception:
        pass

    return local_fallback_response(intent, query)
