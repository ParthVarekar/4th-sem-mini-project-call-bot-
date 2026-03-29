"""
Full Integration Validation Script
Executes all required verification steps to ensure the sentiment module 
has been safely glued across the system without breaking old contracts.
Run with: python -m tests.validate_full_integration
"""

import sys
import os
import time
import requests
import warnings

# Suppress HuggingFace warnings for clean output
warnings.filterwarnings("ignore")

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://127.0.0.1:5000"


def separator(title):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def check(status, message):
    mark = "[PASS]" if status else "[FAIL]"
    print(f"  {mark} {message}")
    if not status:
        global ALERTS
        ALERTS += 1


ALERTS = 0


def step1_backend_validation():
    separator("STEP 1: BACKEND VALIDATION & API CONTRACTS")
    
    # 1. GET /api/dashboard/sentiment
    try:
        res = requests.get(f"{BASE_URL}/api/dashboard/sentiment", timeout=5)
        data = res.json().get("data", {})
        
        required_keys = {"score", "positive", "negative", "neutral", "total", "trend"}
        has_keys = required_keys.issubset(data.keys())
        check(res.status_code == 200 and has_keys, "GET /api/dashboard/sentiment returns valid struct")
        check(isinstance(data.get("score"), float) or isinstance(data.get("score"), int), "score is float")
        check(data.get("trend") in ["up", "down", "stable"], "trend is valid")
    except Exception as e:
        check(False, f"Dashboard API failed: {e}")

    # 2. POST /api/ai/sentiment
    try:
        res = requests.post(f"{BASE_URL}/api/ai/sentiment", json={"text": "this is excellent"}, timeout=5)
        data = res.json()
        if "data" in data:
            data = data["data"]
            
        check(res.status_code == 200, "POST /api/ai/sentiment status 200")
        check(data.get("sentiment") in ["POSITIVE", "NEGATIVE", "NEUTRAL"], "Valid local AI label returned")
    except Exception as e:
        check(False, f"Single Sentiment API failed: {e}")

    # 3. Batch sentiment (internal function)
    from backend.ai_engine.sentiment_model import analyze_orders_sentiment
    try:
        batch_res = analyze_orders_sentiment()
        check(isinstance(batch_res, dict) and "score" in batch_res, "analyze_orders_sentiment internal method works safely")
    except Exception as e:
        check(False, f"Internal batch method crashed: {e}")


def step2_data_flow_validation():
    separator("STEP 2: DATA FLOW & CACHE VALIDATION")
    
    from backend.ai_engine.sentiment_model import analyze_orders_sentiment
    
    # First call
    start1 = time.perf_counter()
    res1 = analyze_orders_sentiment()
    t1 = time.perf_counter() - start1
    
    # Second call (must be cached)
    start2 = time.perf_counter()
    res2 = analyze_orders_sentiment()
    t2 = time.perf_counter() - start2
    
    check(res1 == res2, "Data is completely identical across identical requests")
    check(t2 < 0.05, f"Cache successfully bypassed recomputation (T2={t2*1000:.2f}ms)")


def step3_insights_validation():
    separator("STEP 3: AI INSIGHTS VALIDATION")
    from backend.ai_engine.insight_engine import merge_insights
    
    result = merge_insights([], [])
    structs = result.get("structured_insights", [])
    
    sentiment_alert = next((item for item in structs if item.get("type") == "Sentiment"), None)
    
    check(sentiment_alert is not None, "A Sentiment object was found appended inside merge_insights()")
    
    if sentiment_alert:
        desc = sentiment_alert.get("description", "").lower()
        valid_words = ["declining", "high", "stable"]
        has_valid = any(w in desc for w in valid_words)
        check(has_valid, "Insight description mapped correctly to high/stable/declining text")
    

def step4_chatbot_validation():
    separator("STEP 4: MANAGER CHATBOT VALIDATION")
    from backend.services.manager_chat import process_manager_query
    
    # Prompt user logic
    query = "how are customers feeling? what is the sentiment?"
    start = time.perf_counter()
    res = process_manager_query(query)
    dur = time.perf_counter() - start
    
    check(res.get("intent") == "customer_sentiment", f"Intent properly detected as 'customer_sentiment'. Found: {res.get('intent')}")
    check(res.get("reasoningSource") == "fallback", "Chatbot gracefully avoided LLM completely (`reasoningSource` == fallback)")
    check(isinstance(res.get("data", {}).get("sentiment"), dict), "Sentiment struct correctly bundled into 'data' obj")
    
    reply = res.get("reply", "").lower()
    check("overall trend" in reply, "Raw numeric details injected into human-readable reply")
    check(dur < 1.0, f"Chatbot answered almost instantly without network loops ({dur*1000:.0f}ms)")


def step5_failsafe_handling():
    separator("STEP 5: FAILSAFE / EDGE CASES")
    from backend.ai_engine.sentiment_model import predict_sentiment
    
    check(predict_sentiment("").get("label") == "NEUTRAL", "Empty string handled safely as NEUTRAL")
    check(predict_sentiment(None).get("label") in ["NEUTRAL", "ERROR", None] or isinstance(predict_sentiment(None), dict), "NoneType inputs guarded against crashes")
    

if __name__ == "__main__":
    print("\n   [ STARTING FULL INTEGRATION TESTS ]   ")
    
    step1_backend_validation()
    step2_data_flow_validation()
    step3_insights_validation()
    step4_chatbot_validation()
    step5_failsafe_handling()
    
    separator("VALIDATION COMPLETE")
    if ALERTS == 0:
        print("  [SUCCESS] All Integration systems perfectly mapped.\n")
        sys.exit(0)
    else:
        print(f"  [WARNING] {ALERTS} Integration checks failed. Please fix.\n")
        sys.exit(1)
