import os
import csv
import json
from backend.ai_engine.mock_data_generator import generate

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

# Ensure data exists before loading
generate()

def load_orders():
    orders = []
    file_path = os.path.join(DATA_DIR, 'orders.csv')
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                row['price'] = float(row['price'])
                row['items'] = json.loads(row['items'])
            except:
                pass
            orders.append(row)
    # Sort orders by timestamp descending
    orders.sort(key=lambda x: x['timestamp'], reverse=True)
    return orders

def load_menu_items():
    items = []
    file_path = os.path.join(DATA_DIR, 'menu_items.csv')
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['price'] = float(row['price'])
            items.append(row)
    return items

def load_customers():
    customers = []
    file_path = os.path.join(DATA_DIR, 'customers.csv')
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['points'] = int(row['loyalty_points']) if 'loyalty_points' in row else int(row.get('points', 0))
            row['customer_id'] = int(row['customer_id'])
            customers.append(row)
    return customers

def get_ai_structured_insights():
    file_path = os.path.join(DATA_DIR, 'ai_structured_insights.json')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return None

def load_call_logs():
    logs = []
    file_path = os.path.join(DATA_DIR, 'call_logs.csv')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['call_id'] = int(row['call_id'])
                row['call_duration'] = int(row['call_duration'])
                logs.append(row)
        logs.sort(key=lambda x: x['timestamp'], reverse=True)
    return logs

def load_combo_meals():
    combos = []
    file_path = os.path.join(DATA_DIR, 'combo_meals.csv')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['combo_id'] = int(row['combo_id'])
                row['price'] = float(row['price'])
                row['popularity_score'] = int(row['popularity_score'])
                try:
                    row['items'] = json.loads(row['items'])
                except:
                    pass
                combos.append(row)
    return combos

def load_rewards_program():
    rewards = []
    file_path = os.path.join(DATA_DIR, 'rewards_program.csv')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['customer_id'] = int(row['customer_id'])
                row['points'] = int(row['points'])
                rewards.append(row)
    return rewards

def load_holiday_schedule():
    holidays = []
    file_path = os.path.join(DATA_DIR, 'holiday_schedule.csv')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                holidays.append(row)
    return holidays
