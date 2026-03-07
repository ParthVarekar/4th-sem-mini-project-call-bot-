import pandas as pd
import os
from datetime import datetime
from threading import Lock

class ExcelService:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data')
        self.appointments_file = os.path.join(self.data_dir, 'appointments.xlsx')
        self.orders_file = os.path.join(self.data_dir, 'orders.xlsx')
        self.lock = Lock()
        
        # Ensure data directory exists
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Initialize files if they don't exist
        self._initialize_file(self.appointments_file, ['Name', 'Phone', 'Service', 'Date', 'Time', 'Timestamp'])
        self._initialize_file(self.orders_file, ['Product', 'Quantity', 'Address', 'Phone', 'Timestamp'])

    def _initialize_file(self, filepath, columns):
        if not os.path.exists(filepath):
            df = pd.DataFrame(columns=columns)
            df.to_excel(filepath, index=False, engine='openpyxl')

    def save_appointment(self, data):
        """
        Saves appointment data to Excel.
        data: dict with Name, Phone, Service, Date, Time
        """
        with self.lock:
            try:
                # Add Timestamp
                data['Timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Load existing
                if os.path.exists(self.appointments_file):
                    df = pd.read_excel(self.appointments_file, engine='openpyxl')
                else:
                    df = pd.DataFrame(columns=['Name', 'Phone', 'Service', 'Date', 'Time', 'Timestamp'])
                
                # Append new row
                new_row = pd.DataFrame([data])
                df = pd.concat([df, new_row], ignore_index=True)
                
                # Save
                df.to_excel(self.appointments_file, index=False, engine='openpyxl')
                return True
            except Exception as e:
                print(f"Error saving appointment: {e}")
                return False

    def save_order(self, data):
        """
        Saves order data to Excel.
        data: dict with Product, Quantity, Address, Phone
        """
        with self.lock:
            try:
                # Add Timestamp
                data['Timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Load existing
                if os.path.exists(self.orders_file):
                    df = pd.read_excel(self.orders_file, engine='openpyxl')
                else:
                    df = pd.DataFrame(columns=['Product', 'Quantity', 'Address', 'Phone', 'Timestamp'])
                
                # Append new row
                new_row = pd.DataFrame([data])
                df = pd.concat([df, new_row], ignore_index=True)
                
                # Save
                df.to_excel(self.orders_file, index=False, engine='openpyxl')
                return True
            except Exception as e:
                print(f"Error saving order: {e}")
                return False

# Singleton instance
excel_service = ExcelService()
