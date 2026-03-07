import sys
import os
import json
import time

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import app

def test_voice_flow():
    print("[>] Starting Voice Flow Test...")
    
    # Create a test client
    with app.test_client() as client:
        session_id = "test_user_complete_flow"
        
        # Helper to send message
        def send(msg):
            print(f"\n[You]: {msg}")
            payload = {"session_id": session_id, "message": msg}
            # Add delay to respect Gemini Free Tier rate limits
            print("...waiting 10s...")
            time.sleep(10)
            resp = client.post('/voice/chat', json=payload)
            if resp.status_code == 200:
                print(f"[AI]: {resp.json.get('response')}")
                return resp.json.get('response')
            else:
                print(f"[X] Error: {resp.status_code}")
                return None

        # Step 1: Greeting
        send("Hello")

        # Step 2: Intent
        send("I want to book an appointment for a haircut")

        # Step 3: Name
        send("My name is Alice")
        
        # Step 4: Date
        send("I want to come in next Tuesday")

        # Step 5: Time
        send("At 10 AM")
        
        # Step 6: Phone
        send("My number is 555-0199")
        
        # Step 7: Confirmation
        # The AI should be asking for confirmation now.
        last_response = send("Yes, that is correct")
        
        # Check if console shows extraction logs (manual verification mostly)
        if last_response and ("process" in last_response.lower() or "confirmed" in last_response.lower()):
            print("\n[!] success phrase detected. Check server logs for Data Extraction.")
        else:
            print("\n[?] Success phrase NOT detected. Conversational flow might be stuck or different.")

    print("\n[!] Test Complete!")

if __name__ == "__main__":
    test_voice_flow()
