import json
import requests
import re
from backend.services.analytics import get_business_context, compute_total_revenue, compute_top_customers, get_combo_opportunities

OLLAMA_URL = 'http://localhost:11434/api/generate'
OLLAMA_MODEL = 'gemma:2b'

INTENTS = [
    "financial_analysis",
    "menu_performance",
    "combo_recommendation",
    "customer_rewards",
    "discount_strategy",
    "peak_hours_analysis",
    "customer_insights",
    "marketing_recommendations",
    "operational_recommendations",
    "dashboard_help",
    "general_question"
]

def detect_intent_deterministic(query: str):
    q = query.lower()
    if any(w in q for w in ["revenue", "sales", "finance", "money", "profit"]): return "financial_analysis"
    if any(w in q for w in ["menu", "item", "dish", "best", "worst", "popular"]): return "menu_performance"
    if any(w in q for w in ["combo", "bundle", "meal"]): return "combo_recommendation"
    if any(w in q for w in ["reward", "loyalty", "point", "vip"]): return "customer_rewards"
    if any(w in q for w in ["discount", "coupon", "sale", "offer"]): return "discount_strategy"
    if any(w in q for w in ["peak", "hour", "time", "busy"]): return "peak_hours_analysis"
    if any(w in q for w in ["customer", "people", "guest"]): return "customer_insights"
    if any(w in q for w in ["market", "promo", "campaign"]): return "marketing_recommendations"
    if any(w in q for w in ["staff", "schedule", "operation", "employee"]): return "operational_recommendations"
    if any(w in q for w in ["dashboard", "how to", "help", "click"]): return "dashboard_help"
    return "general_question"

def local_fallback_response(intent: str, query: str):
    ctx = get_business_context()
    if intent == "financial_analysis":
        return {
            "intent": intent,
            "analysis": f"Your total revenue over the tracked period is {ctx['Total Revenue']}.",
            "data": {"revenue": ctx['Total Revenue'], "aov": ctx['Average Order Value']},
            "recommendation": "Try increasing the price of your most popular items slightly."
        }
    elif intent == "menu_performance":
        return {
            "intent": intent,
            "analysis": f"Your top items are {ctx['Top Menu Items']}. Your worst items are {ctx['Worst Menu Items']}.",
            "data": {"top": ctx['Top Menu Items'].split(", "), "worst": ctx['Worst Menu Items'].split(", ")},
            "recommendation": "Consider dropping the worst-performing items or bundling them with popular ones."
        }
    elif intent == "peak_hours_analysis":
        return {
            "intent": intent,
            "analysis": f"Your busiest time is {ctx['Peak Hours']}.",
            "data": {"peak_hour": ctx['Peak Hours']},
            "recommendation": "Ensure you have maximum staff scheduled during the peak hour."
        }
    elif intent == "combo_recommendation":
        return {
            "intent": intent,
            "analysis": "Combos drive higher average order value.",
            "data": get_combo_opportunities() or {},
            "recommendation": "Review the Combo Meals tab for specific pairings based on past orders."
        }
    elif intent == "customer_rewards":
        return {
            "intent": intent,
            "analysis": "Loyalty programs increase repeat visits.",
            "data": {},
            "recommendation": "Check the Rewards tab to identify top customers and send them a discount."
        }
    else:
        return {
            "intent": "general_question",
            "analysis": "I am your ChefAI Assistant, focused on improving your restaurant's business performance.",
            "data": {},
            "recommendation": "Try asking me about your revenue, menu performance, or peak hours."
        }

def process_manager_query(query: str):
    intent = detect_intent_deterministic(query)
    ctx = get_business_context()
    
    prompt = f"""You are ChefAI, a restaurant manager intelligence assistant. You help the restaurant owner improve performance.
Business Context:
- Total Revenue: {ctx['Total Revenue']}
- Average Order Value: {ctx['Average Order Value']}
- Top Menu Items: {ctx['Top Menu Items']}
- Worst Menu Items: {ctx['Worst Menu Items']}
- Peak Hour: {ctx['Peak Hour'] if 'Peak Hour' in ctx else ctx['Peak Hours']}

User Query: "{query}"

Respond EXACTLY as JSON in this format:
{{
  "intent": "{intent}",
  "analysis": "1-2 sentences explaining exactly what the data implies.",
  "data": {{"metric_name": "value"}},
  "recommendation": "1-2 sentences of actionable business advice."
}}
"""
    try:
        res = requests.post(OLLAMA_URL, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }, timeout=8)
        
        if res.status_code == 200:
            text = res.json().get('response', '')
            try:
                # Sometimes LLM outputs markdown formatting around JSON
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                parsed = json.loads(text)
                
                # Ensure all fields are present
                return {
                    "intent": parsed.get("intent", intent),
                    "analysis": parsed.get("analysis", "Analysis generated successfully."),
                    "data": parsed.get("data", {}),
                    "recommendation": parsed.get("recommendation", "Consider reviewing your dashboard metrics.")
                }
            except json.JSONDecodeError:
                pass
    except Exception as e:
        print(f"[ChefAI] Ollama offline or error: {e}. Falling back deterministically.")
    
    return local_fallback_response(intent, query)
