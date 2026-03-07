import sys
import os

# Add project root to path so we can import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.llm import LLMClient

def test_llm_connection():
    print("Testing LLM Client...")
    
    try:
        llm = LLMClient()
        print("OK LLM Client initialized.")
    except Exception as e:
        print(f"[X] Failed to initialize LLM Client: {e}")
        return

    # Test conversation
    history = [{"role": "user", "content": "Hello! Who are you?"}]
    print("\nSending: 'Hello! Who are you?'")
    
    response = llm.generate_response(history)
    print(f"\nResponse:\n{response}")

    # Test data extraction
    fake_conversation = """
    User: I'd like to book an appointment.
    AI: Sure, what is your name?
    User: John Doe.
    AI: And your phone number?
    User: 555-0199.
    AI: When would you like to come in?
    User: Next Tuesday at 10 AM for a haircut.
    """
    print("\nTesting Data Extraction...")
    extracted_json = llm.extract_data(fake_conversation)
    print(f"\nExtracted JSON:\n{extracted_json}")

if __name__ == "__main__":
    test_llm_connection()
