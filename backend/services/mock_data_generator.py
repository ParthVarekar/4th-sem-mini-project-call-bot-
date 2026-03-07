import os
import csv
import json
import random
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

MENU_ITEMS_DATA = [
    {"name": "Truffle Burger", "category": "burger", "price": 14.99, "cost": 4.50, "popularity": 8},
    {"name": "Classic Burger", "category": "burger", "price": 10.99, "cost": 3.00, "popularity": 9},
    {"name": "Double Cheeseburger", "category": "burger", "price": 13.99, "cost": 4.00, "popularity": 8},
    {"name": "Mushroom Swiss", "category": "burger", "price": 12.99, "cost": 3.50, "popularity": 7},
    {"name": "Margherita Pizza", "category": "pizza", "price": 16.99, "cost": 4.00, "popularity": 9},
    {"name": "Pepperoni Pizza", "category": "pizza", "price": 18.99, "cost": 5.00, "popularity": 10},
    {"name": "BBQ Chicken Pizza", "category": "pizza", "price": 19.99, "cost": 5.50, "popularity": 8},
    {"name": "Penne Arrabbiata", "category": "pasta", "price": 14.99, "cost": 3.00, "popularity": 6},
    {"name": "Spaghetti Carbonara", "category": "pasta", "price": 16.99, "cost": 4.50, "popularity": 7},
    {"name": "Fettuccine Alfredo", "category": "pasta", "price": 15.99, "cost": 4.00, "popularity": 8},
    {"name": "Chicken Caesar Wrap", "category": "wrap", "price": 11.99, "cost": 3.50, "popularity": 8},
    {"name": "Veggie Wrap", "category": "wrap", "price": 10.99, "cost": 3.00, "popularity": 6},
    {"name": "Caesar Salad", "category": "salad", "price": 9.99, "cost": 2.50, "popularity": 7},
    {"name": "Greek Salad", "category": "salad", "price": 10.99, "cost": 3.00, "popularity": 6},
    {"name": "Fries", "category": "side", "price": 4.99, "cost": 1.00, "popularity": 10},
    {"name": "Onion Rings", "category": "side", "price": 5.99, "cost": 1.50, "popularity": 7},
    {"name": "Garlic Bread", "category": "side", "price": 4.99, "cost": 1.00, "popularity": 8},
    {"name": "Coke", "category": "drink", "price": 2.50, "cost": 0.50, "popularity": 9},
    {"name": "Diet Coke", "category": "drink", "price": 2.50, "cost": 0.50, "popularity": 8},
    {"name": "Sprite", "category": "drink", "price": 2.50, "cost": 0.50, "popularity": 7},
    {"name": "Iced Tea", "category": "drink", "price": 2.99, "cost": 0.60, "popularity": 8},
    {"name": "Chocolate Shake", "category": "dessert", "price": 6.99, "cost": 2.00, "popularity": 8},
    {"name": "Cheesecake", "category": "dessert", "price": 7.99, "cost": 2.50, "popularity": 7},
    {"name": "Brownie Sundae", "category": "dessert", "price": 8.99, "cost": 3.00, "popularity": 9}
]

def get_menu_dict():
    return {item["name"]: item for item in MENU_ITEMS_DATA}

def generate_menu_items():
    print("Generating menu_items.csv...")
    file_path = os.path.join(DATA_DIR, 'menu_items.csv')
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['item_id', 'name', 'category', 'price', 'cost', 'popularity_score'])
        for i, item in enumerate(MENU_ITEMS_DATA, 1):
            writer.writerow([i, item['name'], item['category'], item['price'], item['cost'], item['popularity']])

def generate_customers():
    print("Generating customers.csv...")
    file_path = os.path.join(DATA_DIR, 'customers.csv')
    first_names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Lisa", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
    
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['customer_id', 'name', 'email', 'loyalty_points', 'tier', 'visit_count', 'total_spent'])
        for i in range(1, 401): # 400 customers
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            email = f"{name.lower().replace(' ', '.')}@example.com"
            visit_count = random.randint(1, 40)
            
            # Weighted spent based on visits
            avg_order = random.uniform(20, 60)
            total_spent = round(visit_count * avg_order, 2)
            
            loyalty_points = int(total_spent * 0.1) * 10 # roughly 10 points per $10 spent
            
            if loyalty_points > 1000:
                tier = "Platinum"
            elif loyalty_points > 500:
                tier = "Gold"
            elif loyalty_points > 200:
                tier = "Silver"
            else:
                tier = "Bronze"
                
            writer.writerow([i, name, email, loyalty_points, tier, visit_count, total_spent])

def generate_orders():
    print("Generating orders.csv...")
    file_path = os.path.join(DATA_DIR, 'orders.csv')
    menu_dict = get_menu_dict()
    menu_names = list(menu_dict.keys())
    
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['order_id', 'timestamp', 'items', 'price', 'customer_id', 'order_type'])
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=45) # 45 days of data
        num_orders = random.randint(3500, 4500)
        
        for i in range(1, num_orders + 1):
            # Generate realistic timestamps (more orders on weekends & evenings)
            date = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
            
            # Adjust hour to be realistic (mostly 11-14 and 17-22)
            hour_rand = random.random()
            if hour_rand < 0.3:
                hour = random.randint(11, 14) # Lunch
            elif hour_rand < 0.8:
                hour = random.randint(17, 21) # Dinner
            else:
                hour = random.choice([10, 15, 16, 22, 23]) # Off-peak
                
            date = date.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
            
            num_items = random.choices([1, 2, 3, 4, 5, 6], weights=[10, 30, 30, 15, 10, 5])[0]
            
            # Smart item selection (main + side + drink)
            items = []
            mains = [m for m in menu_names if menu_dict[m]["category"] in ["burger", "pizza", "pasta", "wrap", "salad"]]
            sides = [m for m in menu_names if menu_dict[m]["category"] == "side"]
            drinks = [m for m in menu_names if menu_dict[m]["category"] == "drink"]
            
            if num_items >= 1:
                items.append(random.choice(mains))
            if num_items >= 2:
                items.append(random.choice(sides))
            if num_items >= 3:
                items.append(random.choice(drinks))
                
            # Random remaining items
            for _ in range(num_items - 3):
                items.append(random.choice(menu_names))
                
            price = sum(menu_dict[item]["price"] for item in items)
            
            customer_id = random.choices(
                [random.randint(1, 400), "None"], 
                weights=[70, 30] # 70% identified customers
            )[0]
            if customer_id == "None":
                customer_id = ""
                
            order_type = random.choices(['dine-in', 'takeout', 'delivery'], weights=[40, 30, 30])[0]
            
            writer.writerow([i, date.isoformat(), json.dumps(items), round(price, 2), customer_id, order_type])

def generate_call_logs():
    print("Generating call_logs.csv...")
    file_path = os.path.join(DATA_DIR, 'call_logs.csv')
    
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['call_id', 'timestamp', 'customer_name', 'call_duration', 'call_topic', 'order_value'])
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=45)
        num_calls = random.randint(2200, 2800)
        
        topics = ['Order Placement', 'Reservation', 'General Inquiry', 'Complaint', 'Menu Question', 'Hours/Location']
        topic_weights = [50, 20, 10, 5, 10, 5]
        
        names = ["James S.", "Mary J.", "Robert W.", "Patricia B.", "John J.", "Anonymous", "Unknown"]
        
        for i in range(1, num_calls + 1):
            date = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
            
            topic = random.choices(topics, weights=topic_weights)[0]
            
            if topic == 'Order Placement':
                duration = random.randint(120, 300)
                order_val = round(random.uniform(15, 80), 2)
            elif topic == 'Complaint':
                duration = random.randint(200, 600)
                order_val = ""
            elif topic == 'Reservation':
                duration = random.randint(60, 180)
                order_val = ""
            else:
                duration = random.randint(30, 120)
                order_val = ""
                
            name = random.choice(names) if random.random() > 0.3 else f"Caller {random.randint(1000, 9999)}"
            
            writer.writerow([i, date.isoformat(), name, duration, topic, order_val])

def generate_combo_meals():
    print("Generating combo_meals.csv...")
    file_path = os.path.join(DATA_DIR, 'combo_meals.csv')
    
    combos = [
        [1, "Classic Burger Meal", '["Classic Burger", "Fries", "Coke"]', 14.99, 95],
        [2, "Truffle Lovers", '["Truffle Burger", "Onion Rings", "Chocolate Shake"]', 23.99, 82],
        [3, "Pizza Date Night", '["Margherita Pizza", "Pepperoni Pizza", "Garlic Bread", "Coke"]', 35.99, 88],
        [4, "Healthy Lunch", '["Chicken Caesar Wrap", "Greek Salad", "Iced Tea"]', 17.99, 75],
        [5, "Pasta Duo", '["Spaghetti Carbonara", "Fettuccine Alfredo", "Garlic Bread"]', 28.99, 70]
    ]
    
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['combo_id', 'name', 'items', 'price', 'popularity_score'])
        for combo in combos:
            writer.writerow(combo)

def generate_rewards_program():
    print("Generating rewards_program.csv...")
    file_path = os.path.join(DATA_DIR, 'rewards_program.csv')
    
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['customer_id', 'points', 'tier', 'recommended_reward'])
        
        for i in range(1, 101): # subset of customers
            points = random.randint(100, 2500)
            if points > 1000:
                tier = "Platinum"
                reward = random.choice(["20% Off Next Order", "Free Dessert & Drink", "Priority Seating"])
            elif points > 500:
                tier = "Gold"
                reward = random.choice(["15% Off Next Order", "Free Dessert", "Free Side"])
            elif points > 200:
                tier = "Silver"
                reward = random.choice(["10% Off Next Order", "Free Drink"])
            else:
                tier = "Bronze"
                reward = "Double Points on Next Order"
                
            writer.writerow([i, points, tier, reward])

def generate_holiday_schedule():
    print("Generating holiday_schedule.csv...")
    file_path = os.path.join(DATA_DIR, 'holiday_schedule.csv')
    
    holidays = [
        ["2026-02-14", "Valentine's Day", "Staff extra hosts and servers for couples. Promote Date Night Combo.", "High"],
        ["2026-03-17", "St. Patrick's Day", "Expect higher drink sales. Ensure bar is fully stocked.", "Medium"],
        ["2026-05-10", "Mother's Day", "Busiest brunch day. All hands on deck. Prepare free desserts for moms.", "Very High"],
        ["2026-07-04", "Independence Day", "Manage takeout volume. Dine-in may be slow evening.", "Medium"],
        ["2026-10-31", "Halloween", "High evening delivery volume. Add drivers.", "High"],
        ["2026-11-26", "Thanksgiving", "Closed or limited hours. Check inventory before.", "Low"],
        ["2026-12-25", "Christmas", "Closed. Focus on pre-holiday parties the week prior.", "Low"],
        ["2026-12-31", "New Year's Eve", "High volume late night dining. Party prep.", "Very High"]
    ]
    
    with open(file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['date', 'event', 'staffing_tip', 'expected_traffic'])
        for h in holidays:
            writer.writerow(h)

def generate_ai_insights():
    print("Generating ai_structured_insights.json...")
    file_path = os.path.join(DATA_DIR, 'ai_structured_insights.json')
    
    insights = {
        "status": "success",
        "source": "gemma:2b",
        "recommendations": "Based on the generated restaurant data, Classic Burgers and Fries are frequently ordered together. Evening hours between 18:00 and 20:00 see the highest call volume. Consider increasing dinner staffing.",
        "structured_insights": [
            {
                "type": "combo",
                "items": ["Classic Burger", "Fries"],
                "support": 0.35, # Frequency in orders
                "confidence": 0.85 # Likelihood of Fries if Burger is ordered
            },
            {
                "type": "combo",
                "items": ["Pepperoni Pizza", "Coke"],
                "support": 0.22,
                "confidence": 0.70
            },
            {
                "type": "peak_hour",
                "hour": 19,
                "order_count": 845,
                "avg_duration": 145
            },
            {
                "type": "busiest_day",
                "day": "Friday",
                "order_count": 1250,
                "revenue": 25430
            },
            {
                "type": "popular_item",
                "item": "Truffle Burger",
                "sales": 1420,
                "revenue": 21285.80
            },
            {
                "type": "slow_item",
                "item": "Veggie Wrap",
                "sales": 150,
                "revenue": 1648.50,
                "action_recommended": "Consider discounting or replacing"
            }
        ]
    }
    
    with open(file_path, 'w') as f:
        json.dump(insights, f, indent=2)

def generate_all_mock_data(force=True):
    # force=True ignores existing files and regenerates them
    generate_menu_items()
    generate_customers()
    generate_orders()
    generate_call_logs()
    generate_combo_meals()
    generate_rewards_program()
    generate_holiday_schedule()
    generate_ai_insights()

if __name__ == "__main__":
    generate_all_mock_data(force=True)
    print("All required mock datasets generated successfully.")
