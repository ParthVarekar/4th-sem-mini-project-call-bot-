"""
Mock Data Generator
Generates ~10000 realistic restaurant orders and supporting datasets for expanding ChefAI realism.
"""

import os
import random
import csv
import json
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

MENU_ITEMS = [
    {"item_id": 1, "name": "Burger",       "price": 8.99,  "category": "Main", "cost": 3.00},
    {"item_id": 2, "name": "Fries",        "price": 3.99,  "category": "Side", "cost": 1.00},
    {"item_id": 3, "name": "Coke",         "price": 1.99,  "category": "Drink", "cost": 0.50},
    {"item_id": 4, "name": "Pizza",        "price": 12.99, "category": "Main", "cost": 4.50},
    {"item_id": 5, "name": "Chicken Wrap", "price": 9.49,  "category": "Main", "cost": 3.20},
    {"item_id": 6, "name": "Caesar Salad", "price": 7.49,  "category": "Side", "cost": 2.50},
    {"item_id": 7, "name": "Pasta",        "price": 11.49, "category": "Main", "cost": 3.50},
    {"item_id": 8, "name": "Garlic Bread", "price": 4.49,  "category": "Side", "cost": 1.20},
]

INGREDIENTS = [
    {"ingredient_id": 1, "name": "Beef Patty", "supplier_id": 1, "unit": "pcs", "cost": 1.50},
    {"ingredient_id": 2, "name": "Burger Bun", "supplier_id": 2, "unit": "pcs", "cost": 0.50},
    {"ingredient_id": 3, "name": "Lettuce", "supplier_id": 3, "unit": "kg", "cost": 2.00},
    {"ingredient_id": 4, "name": "Tomato", "supplier_id": 3, "unit": "kg", "cost": 3.00},
    {"ingredient_id": 5, "name": "Cheese", "supplier_id": 4, "unit": "kg", "cost": 5.00},
    {"ingredient_id": 6, "name": "Potato", "supplier_id": 3, "unit": "kg", "cost": 1.00},
    {"ingredient_id": 7, "name": "Cola Syrup", "supplier_id": 5, "unit": "liters", "cost": 4.00},
    {"ingredient_id": 8, "name": "Pizza Dough", "supplier_id": 2, "unit": "pcs", "cost": 1.00},
    {"ingredient_id": 9, "name": "Tomato Sauce", "supplier_id": 3, "unit": "liters", "cost": 3.50},
    {"ingredient_id": 10, "name": "Chicken Breast", "supplier_id": 1, "unit": "kg", "cost": 6.00},
    {"ingredient_id": 11, "name": "Tortilla", "supplier_id": 2, "unit": "pcs", "cost": 0.40},
    {"ingredient_id": 12, "name": "Pasta Dry", "supplier_id": 2, "unit": "kg", "cost": 2.50},
    {"ingredient_id": 13, "name": "Garlic", "supplier_id": 3, "unit": "kg", "cost": 4.50},
]

SUPPLIERS = [
    {"supplier_id": 1, "name": "Prime Meats Co", "category": "meat", "lead_time_days": 2, "rating": 4.8},
    {"supplier_id": 2, "name": "Golden Grains Bakery", "category": "bakery", "lead_time_days": 1, "rating": 4.5},
    {"supplier_id": 3, "name": "Fresh Farms Produce", "category": "produce", "lead_time_days": 1, "rating": 4.7},
    {"supplier_id": 4, "name": "Valley Dairy", "category": "dairy", "lead_time_days": 2, "rating": 4.6},
    {"supplier_id": 5, "name": "National Beverage Dist", "category": "beverage", "lead_time_days": 3, "rating": 4.9},
]

COMBO_BIASES = [
    (["Burger", "Fries"], 0.15),
    (["Burger", "Coke"], 0.10),
    (["Pizza", "Coke"], 0.10),
    (["Pasta", "Garlic Bread"], 0.08),
    (["Chicken Wrap", "Fries", "Coke"], 0.05),
]

# Weekend and holiday spikes
def _get_volume_multiplier(date: datetime) -> float:
    # Handle Holidays (rough proxies)
    if date.month == 12 and date.day in [24, 25, 31]: return 2.0
    if date.month == 2 and date.day == 14: return 1.8
    if date.month == 7 and date.day == 4: return 1.5
    # Weekends (5=Sat, 6=Sun)
    if date.weekday() >= 5: return 1.4
    if date.weekday() == 4: return 1.2 # Friday evening impact usually
    return 1.0

# 0-23 hours
HOUR_WEIGHTS = [
    0.5, 0.2, 0.1, 0.1, 0.1, 0.2,   # 0-5
    0.5, 1.0, 2.0, 2.5, 2.0, 3.5,   # 6-11  (breakfast/lunch start)
    5.0, 4.5, 3.0, 2.0, 2.5, 4.0,   # 12-17 (lunch peak)
    6.0, 7.5, 6.5, 5.0, 3.0, 1.5,   # 18-23 (dinner peak)
]

NUM_ORDERS = 10000
NUM_CUSTOMERS = 400
NUM_TABLES = 30
NUM_STAFF = 20

def _random_timestamp(start: datetime, end: datetime) -> datetime:
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)

def _pick_items() -> list:
    roll = random.random()
    cumulative = 0.0
    for combo, prob in COMBO_BIASES:
        cumulative += prob
        if roll < cumulative:
            return combo
    count = random.choices([1, 2, 3, 4], weights=[0.2, 0.4, 0.3, 0.1])[0]
    names = [m["name"] for m in MENU_ITEMS]
    return random.sample(names, count)

def _price_for(item_name: str) -> float:
    for m in MENU_ITEMS:
        if m["name"] == item_name: return m["price"]
    return 0.0

def generate():
    os.makedirs(DATA_DIR, exist_ok=True)
    random.seed(42)

    end_date = datetime.now()
    start_date = end_date - timedelta(days=45)
    
    print("Generating new realistic POS datasets...")

    # --- 1. suppliers.csv ---
    suppliers_path = DATA_DIR / "suppliers.csv"
    with open(suppliers_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["supplier_id", "name", "category", "lead_time_days", "rating"])
        writer.writeheader()
        writer.writerows(SUPPLIERS)
    
    # --- 2. inventory.csv ---
    inventory_path = DATA_DIR / "inventory.csv"
    with open(inventory_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["ingredient_id", "ingredient_name", "supplier_id", "current_stock", "reorder_level", "cost_per_unit", "unit"])
        writer.writeheader()
        for ing in INGREDIENTS:
            stock = random.randint(50, 500)
            writer.writerow({
                "ingredient_id": ing["ingredient_id"],
                "ingredient_name": ing["name"],
                "supplier_id": ing["supplier_id"],
                "current_stock": stock,
                "reorder_level": int(stock * 0.3),
                "cost_per_unit": ing["cost"],
                "unit": ing["unit"]
            })

    # --- 3. menu_ingredients.csv ---
    mi_path = DATA_DIR / "menu_ingredients.csv"
    with open(mi_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["menu_item_id", "ingredient_id", "quantity"])
        writer.writeheader()
        # Mock mappings
        mappings = [
            (1, 1, 1), (1, 2, 1), (1, 3, 0.1), (1, 4, 0.1), (1, 5, 0.05), # Burger
            (2, 6, 0.3), # Fries
            (3, 7, 0.4), # Coke
            (4, 8, 1), (4, 9, 0.2), (4, 5, 0.15), # Pizza
            (5, 10, 0.2), (5, 11, 1), (5, 3, 0.1), # Wrap
            (6, 3, 0.2), (6, 5, 0.05), # Salad
            (7, 12, 0.2), (7, 9, 0.15), (7, 13, 0.02), # Pasta
            (8, 2, 0.5), (8, 13, 0.05) # Garlic Bread
        ]
        for m_id, i_id, qty in mappings:
            writer.writerow({"menu_item_id": m_id, "ingredient_id": i_id, "quantity": qty})

    # --- 4. staff.csv ---
    staff_path = DATA_DIR / "staff.csv"
    roles = ["server", "chef", "manager", "host", "bartender"]
    with open(staff_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["staff_id", "name", "role", "shift", "experience_years", "rating"])
        writer.writeheader()
        for i in range(1, NUM_STAFF + 1):
            writer.writerow({
                "staff_id": i,
                "name": f"Employee {i}",
                "role": random.choice(roles),
                "shift": random.choice(["Morning", "Evening", "Night"]),
                "experience_years": random.randint(1, 10),
                "rating": round(random.uniform(3.5, 5.0), 1)
            })

    # --- 5. tables.csv ---
    tables_path = DATA_DIR / "tables.csv"
    sections = ["main_dining", "patio", "bar", "private_room"]
    with open(tables_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["table_id", "seats", "section", "status", "avg_turnover_minutes"])
        writer.writeheader()
        for i in range(1, NUM_TABLES + 1):
            writer.writerow({
                "table_id": i,
                "seats": random.choice([2, 4, 6, 8]),
                "section": random.choice(sections),
                "status": random.choice(["available", "occupied", "dirty", "reserved"]),
                "avg_turnover_minutes": random.randint(45, 90)
            })

    # --- 6. promotions.csv ---
    promos_path = DATA_DIR / "promotions.csv"
    with open(promos_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["promotion_id", "name", "type", "start_date", "end_date", "discount_value", "target_audience", "performance_score"])
        writer.writeheader()
        for i in range(1, 11):
            s_date = _random_timestamp(start_date, end_date)
            e_date = s_date + timedelta(days=random.randint(7, 30))
            writer.writerow({
                "promotion_id": i,
                "name": f"Promo Campaign {i}",
                "type": random.choice(["discount", "combo", "seasonal"]),
                "start_date": s_date.strftime("%Y-%m-%d"),
                "end_date": e_date.strftime("%Y-%m-%d"),
                "discount_value": random.randint(10, 25),
                "target_audience": random.choice(["all", "lapsed", "vip", "students"]),
                "performance_score": round(random.uniform(50, 100), 1)
            })

    # --- 7. reservations.csv ---
    res_path = DATA_DIR / "reservations.csv"
    with open(res_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["reservation_id", "customer_id", "reservation_time", "party_size", "table_number", "status", "wait_time", "special_requests"])
        writer.writeheader()
        for i in range(1, 1001):
            r_time = _random_timestamp(start_date, end_date).replace(minute=random.choice([0, 15, 30, 45]), second=0)
            writer.writerow({
                "reservation_id": i,
                "customer_id": random.randint(1, NUM_CUSTOMERS),
                "reservation_time": r_time.strftime("%Y-%m-%d %H:%M:%S"),
                "party_size": random.randint(2, 8),
                "table_number": random.randint(1, NUM_TABLES),
                "status": random.choice(["completed", "completed", "completed", "cancelled", "no-show"]),
                "wait_time": random.randint(0, 20),
                "special_requests": random.choice(["", "", "", "window seat", "anniversary", "allergy"])
            })

    # --- 8. customers.csv (Extended) ---
    first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack", "Karen", "Leo"]
    customers_path = DATA_DIR / "customers.csv"
    cust_data = []
    
    for cid in range(1, NUM_CUSTOMERS + 1):
        name = random.choice(first_names) + " " + chr(random.randint(65, 90)) + "."
        visit_count = random.randint(1, 50)
        avg_order = random.uniform(15, 75)
        ltv = visit_count * avg_order
        pts = int(ltv * 0.1) * 10
        tier = "Platinum" if pts > 1000 else "Gold" if pts > 500 else "Silver" if pts > 200 else "Bronze"
        # High tier customers prefer dine-in
        pref = "dine-in" if tier in ["Gold", "Platinum"] and random.random() > 0.3 else random.choice(["takeout", "delivery"])
        
        cust_data.append({
            "customer_id": cid,
            "name": name,
            "email": f"customer{cid}@example.com",
            "loyalty_points": pts,
            "tier": tier,
            "visit_count": visit_count,
            "total_spent": round(ltv, 2),
            "preferred_order_type": pref,
            "favorite_category": random.choice(["Main", "Side", "Drink"]),
            "last_visit": _random_timestamp(end_date - timedelta(days=90), end_date).strftime("%Y-%m-%d"),
            "avg_order_value": round(avg_order, 2),
            "lifetime_value": round(ltv, 2)
        })

    with open(customers_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(cust_data[0].keys()))
        writer.writeheader()
        writer.writerows(cust_data)

    # --- 9. orders.csv (Extended, Realistic Timing) ---
    orders_rows = []
    current_time = start_date
    order_id = 1
    
    while current_time < end_date:
        # Generate orders chronologically with realistic gaps
        mult = _get_volume_multiplier(current_time)
        hour_w = HOUR_WEIGHTS[current_time.hour]
        # Base gap is ~30 mins. High weight/mult = smaller gap = more orders.
        # Avoid div by zero
        eff_weight = max(0.1, hour_w * mult)
        gap_minutes = random.uniform(2.0, 60.0) / eff_weight
        
        current_time += timedelta(minutes=gap_minutes)
        if current_time > end_date:
            break

        items = _pick_items()
        subtotal = sum(_price_for(i) for i in items)
        tax = subtotal * 0.08
        discount = 0.0
        
        cust = random.choice(cust_data)
        cid = cust["customer_id"]
        if cust["tier"] in ["Gold", "Platinum"]:
            discount = subtotal * 0.10
            
        total = round(subtotal + tax - discount, 2)
        
        # Delivery peaks at night (18-21), else follow customer preference or random
        o_type = cust["preferred_order_type"]
        if current_time.hour in [18, 19, 20] and random.random() > 0.5:
            o_type = "delivery"

        orders_rows.append({
            "order_id": order_id,
            "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "items": json.dumps(items), # Retain JSON list for backward compatibility
            "price": total, # The legacy endpoint uses this line 
            "customer_id": cid,
            "order_type": o_type,
            "table_number": random.randint(1, NUM_TABLES) if o_type == "dine-in" else "",
            "server_id": random.randint(1, NUM_STAFF) if o_type == "dine-in" else "",
            "subtotal": round(subtotal, 2),
            "tax": round(tax, 2),
            "discount": round(discount, 2),
            "total_price": total,
            "payment_method": random.choice(["card", "card", "card", "cash", "digital"]),
            "prep_time_minutes": random.randint(5, 25),
            "wait_time_minutes": random.randint(0, 15) if o_type != "delivery" else random.randint(30, 60)
        })
        order_id += 1

    orders_path = DATA_DIR / "orders.csv"
    with open(orders_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(orders_rows[0].keys()))
        writer.writeheader()
        writer.writerows(orders_rows)

    # --- 10. call_logs.csv (Extended) ---
    call_path = DATA_DIR / "call_logs.csv"
    call_rows = []
    call_id = 1
    current_time = start_date
    topics = ['Order Placement', 'Reservation', 'General Inquiry', 'Complaint', 'Menu Question', 'Hours/Location']
    
    while current_time < end_date:
        # Spikes near peak hours
        current_time += timedelta(minutes=random.uniform(10.0, 45.0))
        if current_time > end_date:
            break
            
        c_time = current_time
        if random.random() > 0.6:
            c_time = c_time.replace(hour=random.choice([12, 13, 18, 19]))

        topic = random.choices(topics, weights=[40, 30, 10, 5, 10, 5])[0]
        outcome = "resolved"
        dur = random.randint(30, 300)
        sen = round(random.uniform(0.1, 1.0), 2)
        
        if topic == "Complaint":
            outcome = random.choice(["escalated", "resolved", "refunded"])
            sen = round(random.uniform(-1.0, 0.0), 2)
        elif topic == "Order Placement":
            outcome = "order_placed"
        elif topic == "Reservation":
            outcome = "booked"
            
        call_rows.append({
            "call_id": call_id,
            "timestamp": c_time.strftime("%Y-%m-%d %H:%M:%S"),
            "customer_name": f"Caller {call_id}",
            "call_duration": dur,
            "call_topic": topic,
            "order_value": round(random.uniform(15, 80), 2) if outcome == "order_placed" else "",
            "call_outcome": outcome,
            "order_id": random.randint(1, order_id - 1) if (outcome == "order_placed" and order_id > 1) else "",
            "reservation_id": random.randint(1, 1000) if outcome == "booked" else "",
            "sentiment_score": sen
        })
        call_id += 1
        
    call_rows.sort(key=lambda x: x["timestamp"])

    with open(call_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(call_rows[0].keys()))
        writer.writeheader()
        writer.writerows(call_rows)

    # --- 11. menu_items.csv (Rewrite to keep consistent) ---
    menu_path = DATA_DIR / "menu_items.csv"
    with open(menu_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["item_id", "name", "price", "category", "cost"])
        writer.writeheader()
        writer.writerows(MENU_ITEMS)

    # --- 12. Run the reasoning engine so dependencies don't break ---
    print("Done generating CSVs.")
if __name__ == "__main__":
    generate()
    print("Dataset expansion complete.")
