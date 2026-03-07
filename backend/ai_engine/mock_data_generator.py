"""
Mock Data Generator
Generates ~5000 realistic restaurant orders and supporting datasets.
"""

import os
import random
import csv
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

MENU_ITEMS = [
    {"item_id": 1, "name": "Burger",       "price": 8.99,  "category": "Main"},
    {"item_id": 2, "name": "Fries",        "price": 3.99,  "category": "Side"},
    {"item_id": 3, "name": "Coke",         "price": 1.99,  "category": "Drink"},
    {"item_id": 4, "name": "Pizza",        "price": 12.99, "category": "Main"},
    {"item_id": 5, "name": "Chicken Wrap", "price": 9.49,  "category": "Main"},
    {"item_id": 6, "name": "Caesar Salad", "price": 7.49,  "category": "Side"},
    {"item_id": 7, "name": "Pasta",        "price": 11.49, "category": "Main"},
    {"item_id": 8, "name": "Garlic Bread", "price": 4.49,  "category": "Side"},
]

# Realistic combo biases -- these pairs appear more often
COMBO_BIASES = [
    (["Burger", "Fries"], 0.15),
    (["Burger", "Coke"], 0.10),
    (["Pizza", "Coke"], 0.10),
    (["Pasta", "Garlic Bread"], 0.08),
    (["Chicken Wrap", "Fries", "Coke"], 0.05),
]

# Peak-hour weights (index = hour, higher = more likely)
HOUR_WEIGHTS = [
    0.5, 0.2, 0.1, 0.1, 0.1, 0.2,   # 0-5
    0.5, 1.0, 2.0, 2.5, 2.0, 3.5,   # 6-11  (breakfast/lunch)
    5.0, 4.5, 3.0, 2.0, 2.5, 4.0,   # 12-17 (lunch/afternoon)
    6.0, 7.0, 6.5, 5.0, 3.0, 1.5,   # 18-23 (dinner peak)
]

NUM_ORDERS = 5000
NUM_CUSTOMERS = 800


def _random_timestamp(start: datetime, end: datetime) -> datetime:
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def _pick_items() -> list:
    """Pick 1-3 items with realistic combo biases."""
    roll = random.random()
    cumulative = 0.0
    for combo, prob in COMBO_BIASES:
        cumulative += prob
        if roll < cumulative:
            return combo

    # Random pick
    count = random.choices([1, 2, 3], weights=[0.3, 0.5, 0.2])[0]
    names = [m["name"] for m in MENU_ITEMS]
    return random.sample(names, count)


def _price_for(item_name: str) -> float:
    for m in MENU_ITEMS:
        if m["name"] == item_name:
            return m["price"]
    return 0.0


def generate():
    os.makedirs(DATA_DIR, exist_ok=True)
    random.seed(42)

    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 31)
    hours = list(range(24))

    # --- orders.csv ---
    orders_rows = []
    for order_id in range(1, NUM_ORDERS + 1):
        # Pick hour weighted by peak-hour distribution
        hour = random.choices(hours, weights=HOUR_WEIGHTS)[0]
        ts = _random_timestamp(start_date, end_date)
        ts = ts.replace(hour=hour, minute=random.randint(0, 59))

        items = _pick_items()
        total = round(sum(_price_for(i) for i in items), 2)
        customer_id = random.randint(1, NUM_CUSTOMERS)

        orders_rows.append({
            "order_id": order_id,
            "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
            "items": "|".join(items),
            "price": total,
            "customer_id": customer_id,
        })

    orders_path = DATA_DIR / "orders.csv"
    with open(orders_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["order_id", "timestamp", "items", "price", "customer_id"])
        writer.writeheader()
        writer.writerows(orders_rows)
    print(f"  [OK] {orders_path}  ({len(orders_rows)} orders)")

    # --- menu_items.csv ---
    menu_path = DATA_DIR / "menu_items.csv"
    with open(menu_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["item_id", "name", "price", "category"])
        writer.writeheader()
        writer.writerows(MENU_ITEMS)
    print(f"  [OK] {menu_path}  ({len(MENU_ITEMS)} items)")

    # --- customers.csv ---
    first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank",
                   "Grace", "Hank", "Ivy", "Jack", "Karen", "Leo",
                   "Mona", "Nate", "Olivia", "Paul", "Quinn", "Rita"]
    customers_path = DATA_DIR / "customers.csv"
    with open(customers_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["customer_id", "name", "email"])
        writer.writeheader()
        for cid in range(1, NUM_CUSTOMERS + 1):
            name = random.choice(first_names) + " " + chr(random.randint(65, 90)) + "."
            writer.writerow({
                "customer_id": cid,
                "name": name,
                "email": f"customer{cid}@example.com",
            })
    print(f"  [OK] {customers_path}  ({NUM_CUSTOMERS} customers)")


if __name__ == "__main__":
    print("=== Generating Mock Restaurant Data ===\n")
    generate()
    print("\nDone.")
