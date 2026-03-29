import requests
import json

BASE = "http://127.0.0.1:5000"
print(f"Testing {BASE}/health...")
try:
    health = requests.get(f"{BASE}/health", timeout=5).json()
    print("Health Status:", health.get('status'))
except Exception as e:
    print("Health error:", e)

print(f"\nTesting {BASE}/api/dashboard/sentiment...")
try:
    sent = requests.get(f"{BASE}/api/dashboard/sentiment", timeout=10).json()
    print("Sentiment Data:", json.dumps(sent, indent=2))
except Exception as e:
    print("Sentiment error:", e)

print(f"\nTesting {BASE}/api/ai/insights...")
try:
    ins = requests.get(f"{BASE}/api/ai/insights", timeout=10).json()
    data = ins.get('data', {})
    recs = data.get('recommendations', '')
    print("Insights String Length:", len(recs))
    if len(recs) > 0:
        print("Success! Insights exist.")
except Exception as e:
    print("Insights error:", e)
