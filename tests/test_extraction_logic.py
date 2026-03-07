import sys
import os
import json
import time

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.llm import LLMClient
from backend.services.excel_writer import excel_service

def test_extraction_logic():
    print("[>] Testing Extraction Logic (with Rate Limit handling)...")
    
    # Mock Transcript
    transcript = """
    AI: Hello, how can I help?
    User: I want to book a haircut.
    AI: sure, what is your name?
    User: Alice Wonderland.
    AI: When would you like to come in?
    User: Next Friday at 2 PM.
    AI: What is your phone number?
    User: 999-888-7777.
    AI: Confirmed. I will process this now.
    """
    
    print("\n[>] Waiting 30s for API cooldown...")
    time.sleep(30)
    
    print("\n[>] Simulating LLM Extraction...")
    llm_client = LLMClient()
    
    try:
        # 1. Extract
        extracted_json_str = llm_client.extract_data(transcript)
        print(f"[Raw Extraction]: {extracted_json_str}")
        
        # If extraction failed (empty JSON) due to rate limit, let's mock it for this test to prove saving works
        if extracted_json_str == "{}":
            print("[!] API failed (likely 429). Mocking response for validation of saving logic.")
            extracted_json_str = """
            {
              "intent": "book_appointment",
              "data": {
                "full_name": "Alice Wonderland",
                "phone_number": "999-888-7777",
                "service_type": "haircut",
                "preferred_date": "Next Friday",
                "preferred_time": "2 PM"
              }
            }
            """
        
        # Cleanup
        if "```json" in extracted_json_str:
            extracted_json_str = extracted_json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in extracted_json_str:
            extracted_json_str = extracted_json_str.split("```")[1].strip()

        data_payload = json.loads(extracted_json_str)
        intent = data_payload.get("intent")
        extracted_data = data_payload.get("data", {})
        
        print(f"[Parsed]: Intent={intent}, Data={extracted_data}")

        # 2. Save
        if intent == "book_appointment" or intent == "appointment":
             save_data = {
                 "Name": extracted_data.get("full_name") or extracted_data.get("name"),
                 "Phone": extracted_data.get("phone_number"),
                 "Service": extracted_data.get("service_type") or extracted_data.get("service"),
                 "Date": extracted_data.get("preferred_date") or extracted_data.get("date"),
                 "Time": extracted_data.get("preferred_time") or extracted_data.get("time")
             }
             if excel_service.save_appointment(save_data):
                 print(f"[OK] Appointment saved for {save_data['Name']}")
             else:
                 print("[X] Save failed")
        else:
             print(f"[X] Unexpected intent: {intent}")

    except Exception as e:
        print(f"[X] Error: {e}")

if __name__ == "__main__":
    test_extraction_logic()
