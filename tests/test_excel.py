import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.excel_writer import excel_service

def test_excel_writer():
    print("[>] Testing Excel Writer Service...")
    
    # Test Appointment
    appt_data = {
        "Name": "John Doe",
        "Phone": "+1234567890",
        "Service": "Haircut",
        "Date": "2023-10-27",
        "Time": "10:00 AM"
    }
    
    print(f"\n[>] Saving Appointment: {appt_data}")
    success = excel_service.save_appointment(appt_data)
    
    if success:
        print("[OK] Appointment saved successfully.")
    else:
        print("[X] Failed to save appointment.")

    # Test Order
    order_data = {
        "Product": "Pizza",
        "Quantity": 2,
        "Address": "123 Main St",
        "Phone": "+1987654321"
    }
    
    print(f"\n[>] Saving Order: {order_data}")
    success = excel_service.save_order(order_data)
    
    if success:
        print("[OK] Order saved successfully.")
    else:
        print("[X] Failed to save order.")

    print("\n[!] Please check data/appointments.xlsx and data/orders.xlsx to verify contents.")

if __name__ == "__main__":
    test_excel_writer()
