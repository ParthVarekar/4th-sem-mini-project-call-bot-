import pandas as pd
import random
import json
import os
from datetime import datetime, timedelta

# SCALE SETTINGS
NUM_CUSTOMERS = 1200
NUM_ORDERS = 30000
NUM_STAFF = 30

# ---------------- MENU GENERATION ----------------
categories = {
    "Main": ["Pizza", "Burger", "Pasta", "Steak", "Wrap", "Sandwich"],
    "Side": ["Fries", "Garlic Bread", "Salad", "Nachos", "Wings"],
    "Drink": ["Coke", "Pepsi", "Juice", "Coffee", "Beer", "Wine"],
    "Dessert": ["Cake", "Ice Cream", "Brownie", "Donut"]
}

menu = []
item_id = 1

for cat, items in categories.items():
    for base in items:
        for i in range(5):
            price = round(random.uniform(5, 25), 2)
            cost = round(price * random.uniform(0.3, 0.6), 2)
            menu.append({
                "item_id": item_id,
                "name": f"{base} {i+1}",
                "price": price,
                "category": cat,
                "cost": cost
            })
            item_id += 1

menu_df = pd.DataFrame(menu)
menu_df.to_csv("backend/data/menu_items.csv", index=False)

# ---------------- CUSTOMERS ----------------
customers = []
customer_names = []

for i in range(NUM_CUSTOMERS):
    visits = random.randint(1, 80)
    total_spent = round(visits * random.uniform(15, 60), 2)

    tier_roll = random.random()
    if tier_roll > 0.98:
        tier = "Platinum"
        pts = random.randint(2000, 8000)
    elif tier_roll > 0.90:
        tier = "Gold"
        pts = random.randint(800, 1999)
    elif tier_roll > 0.75:
        tier = "Silver"
        pts = random.randint(300, 799)
    else:
        tier = "Bronze"
        pts = random.randint(0, 299)

    name = f"Customer {i}"
    customer_names.append(name)

    customers.append({
        "customer_id": i,
        "name": name,
        "email": f"user{i}@mail.com",
        "loyalty_points": pts,
        "tier": tier,
        "visit_count": visits,
        "total_spent": total_spent,
        "preferred_order_type": random.choice(["delivery", "dine-in", "takeout"]),
        "favorite_category": random.choice(list(categories.keys())),
        "last_visit": str(datetime.now().date()),
        "avg_order_value": round(total_spent / visits, 2)
    })

pd.DataFrame(customers).to_csv("backend/data/customers.csv", index=False)

# ---------------- STAFF ----------------
staff = [
    {"server_id": i, "name": f"Staff {i}", "role": "server", "hourly_rate": random.randint(10, 25)}
    for i in range(NUM_STAFF)
]
pd.DataFrame(staff).to_csv("backend/data/staff.csv", index=False)

# ---------------- ORDERS ----------------
orders = []
start_date = datetime.now() - timedelta(days=120)
menu_names = menu_df["name"].tolist()

for i in range(NUM_ORDERS):
    customer_id = random.randint(0, NUM_CUSTOMERS - 1)
    hour = random.choice([12, 13, 14, 19, 20, 21]) if random.random() > 0.5 else random.randint(10, 23)
    timestamp = start_date + timedelta(days=random.randint(0, 120), hours=hour)
    items = random.sample(menu_names, random.randint(1, 4))
    price = sum(menu_df[menu_df["name"].isin(items)]["price"])
    tax = round(price * 0.1, 2)
    discount = random.choice([0, 0, 0, 2, 5])
    total = round(price + tax - discount, 2)
    prep_time = random.randint(10, 40)
    wait_time = prep_time + random.randint(5, 20)

    orders.append({
        "order_id": i, "timestamp": timestamp, "items": json.dumps(items),
        "price": price, "customer_id": customer_id,
        "order_type": random.choice(["delivery", "dine-in", "takeout"]),
        "table_number": random.randint(1, 40),
        "server_id": random.randint(0, NUM_STAFF - 1),
        "subtotal": price, "tax": tax, "discount": discount, "total_price": total,
        "payment_method": random.choice(["card", "cash", "digital"]),
        "prep_time_minutes": prep_time, "wait_time_minutes": wait_time
    })

pd.DataFrame(orders).to_csv("backend/data/orders.csv", index=False)

# ---------------- TRANSCRIPTS (for sentiment analysis) ----------------
transcripts = []
for i in range(1000):
    wait = random.randint(10, 60)
    caller = random.choice(customer_names)
    if wait > 40:
        text = f"My name is {caller} and the service was very slow and disappointing."
    elif wait > 25:
        text = f"This is {caller}, the food was okay but delivery took time."
    else:
        text = f"Hi, {caller} speaking. Great food and fast service!"
    transcripts.append({"call_id": i, "messages": [{"sender": caller, "text": text}]})

with open("backend/data/transcripts.json", "w") as f:
    json.dump(transcripts, f, indent=2)

# ---------------- INVENTORY ----------------
inventory = [
    {"ingredient_id": i, "ingredient_name": f"Ingredient {i}",
     "supplier_id": random.randint(1, 5),
     "current_stock": random.randint(100, 500),
     "reorder_level": 80, "cost_per_unit": round(random.uniform(1, 5), 2), "unit": "kg"}
    for i in range(50)
]
pd.DataFrame(inventory).to_csv("backend/data/inventory.csv", index=False)

# ---------------- CALL LOGS (powers the Transcripts UI page) ----------------
call_topics = ["Order", "Reservation", "Complaint", "Inquiry", "Feedback", "Cancel"]
call_logs = []
for i in range(50):
    caller = random.choice(customer_names)
    topic = random.choice(call_topics)
    ts = start_date + timedelta(days=random.randint(0, 120), hours=random.randint(9, 21), minutes=random.randint(0, 59))
    duration = random.randint(30, 420)
    order_val = round(random.uniform(12, 80), 2) if topic == "Order" else 0
    status = random.choice(["completed", "missed", "voicemail"]) if random.random() > 0.15 else "missed"
    call_logs.append({
        "call_id": i, "customer_name": caller, "timestamp": ts.isoformat(),
        "call_duration": duration, "call_topic": topic,
        "order_value": order_val, "status": status
    })
pd.DataFrame(call_logs).to_csv("backend/data/call_logs.csv", index=False)

# ---------------- HOLIDAY SCHEDULE (powers the Holiday Schedule UI page) ----------------
holidays_data = [
    {"event": "Valentine's Day", "date": "2026-02-14", "expected_traffic": "High", "staffing_tip": "Schedule extra servers for couples dining. Stock champagne and dessert combos."},
    {"event": "St. Patrick's Day", "date": "2026-03-17", "expected_traffic": "High", "staffing_tip": "Prepare themed menu items and increase bar staff coverage."},
    {"event": "Mother's Day", "date": "2026-05-10", "expected_traffic": "Very High", "staffing_tip": "Open early for brunch service. Pre-book reservation slots to manage overflow."},
    {"event": "Independence Day", "date": "2026-07-04", "expected_traffic": "Medium", "staffing_tip": "Offer takeout specials for outdoor events. Expect lower dine-in, higher delivery."},
    {"event": "Labor Day Weekend", "date": "2026-09-07", "expected_traffic": "Medium", "staffing_tip": "Run weekend combo promotions. Staff for steady but not peak traffic."},
    {"event": "Halloween", "date": "2026-10-31", "expected_traffic": "High", "staffing_tip": "Themed drinks and desserts drive upsells. Expect family-heavy early, adult-heavy late."},
    {"event": "Thanksgiving", "date": "2026-11-26", "expected_traffic": "Low", "staffing_tip": "Most families eat at home. Run Black Friday pre-orders and gift card promotions."},
    {"event": "Christmas Eve", "date": "2026-12-24", "expected_traffic": "High", "staffing_tip": "Premium prix fixe menu opportunity. Book reservations weeks in advance."},
    {"event": "Christmas Day", "date": "2026-12-25", "expected_traffic": "Medium", "staffing_tip": "Reduced hours with premium pricing. Small crew with holiday pay."},
    {"event": "New Year's Eve", "date": "2026-12-31", "expected_traffic": "Very High", "staffing_tip": "All hands on deck. Offer prix fixe dinner and late-night bar service."},
    {"event": "Super Bowl Sunday", "date": "2026-02-08", "expected_traffic": "Very High", "staffing_tip": "Massive delivery and takeout demand. Pre-make wings, pizza, and nachos."},
    {"event": "Father's Day", "date": "2026-06-21", "expected_traffic": "High", "staffing_tip": "Promote steak and grill specials. Family reservation blocks recommended."},
]
pd.DataFrame(holidays_data).to_csv("backend/data/holiday_schedule.csv", index=False)

# ---------------- COMBO MEALS (powers the Combo Meals UI page) ----------------
combo_templates = [
    ("Family Feast", ["Pizza 1", "Fries 2", "Coke 1", "Cake 1"], 34.99),
    ("Lunch Special", ["Burger 1", "Fries 1", "Pepsi 1"], 14.99),
    ("Date Night", ["Pasta 2", "Salad 1", "Wine 1", "Brownie 1"], 42.99),
    ("Game Day Bundle", ["Wings 1", "Nachos 1", "Beer 1", "Beer 2"], 29.99),
    ("Breakfast Combo", ["Sandwich 1", "Coffee 1", "Juice 1"], 12.99),
    ("Kids Meal", ["Burger 2", "Fries 3", "Juice 2", "Ice Cream 1"], 9.99),
    ("Veggie Delight", ["Salad 2", "Wrap 1", "Juice 3"], 16.99),
    ("BBQ Blowout", ["Steak 1", "Wings 2", "Garlic Bread 1", "Beer 3"], 38.99),
    ("Happy Hour", ["Nachos 2", "Beer 1", "Wine 2"], 19.99),
    ("Chef's Special", ["Steak 2", "Salad 3", "Wine 3", "Cake 2"], 49.99),
]
combo_meals = []
for cid, (name, items, price) in enumerate(combo_templates, start=1):
    combo_meals.append({
        "combo_id": cid, "name": name, "items": json.dumps(items),
        "price": price, "popularity_score": random.randint(3, 10)
    })
pd.DataFrame(combo_meals).to_csv("backend/data/combo_meals.csv", index=False)

# ---------------- CLEANUP STALE CACHED FILES ----------------
for stale_file in ["custom_holidays.json"]:
    path = os.path.join("backend", "data", stale_file)
    if os.path.exists(path):
        os.remove(path)
        print(f"  [CLEANUP] Removed stale {stale_file}")

# Also remove the cached transcripts.json used by app_state so it rebuilds from call_logs
stale_transcripts = os.path.join("backend", "data", "transcripts.json")
# NOTE: We keep transcripts.json because sentiment_model reads it directly.
# app_state will detect the call_logs.csv and build fresh transcript UI data.

print("✅ REALISTIC LARGE DATASET GENERATED")
