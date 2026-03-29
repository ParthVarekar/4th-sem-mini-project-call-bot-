from collections import Counter
from datetime import datetime
from backend.services.data_loader import load_orders, load_menu_items, load_customers, get_ai_structured_insights

def compute_total_orders(orders=None):
    if orders is None:
        orders = load_orders()
    return len(orders)

def compute_total_revenue(orders=None):
    if orders is None:
        orders = load_orders()
    return sum(o['price'] for o in orders)

def compute_avg_order_value(orders=None):
    if orders is None:
        orders = load_orders()
    total = len(orders)
    if total == 0: return 0
    return sum(o['price'] for o in orders) / total

def compute_peak_hours(orders=None):
    if orders is None:
        orders = load_orders()
    hours = Counter()
    for o in orders:
        dt = datetime.fromisoformat(o['timestamp'])
        hours[dt.hour] += 1
    # Returns [(hour, count), ...]
    return hours.most_common()

def compute_most_popular_items(orders=None):
    if orders is None:
        orders = load_orders()
    items = Counter()
    for o in orders:
        for item in o['items']:
            items[item] += 1
    return items.most_common()

def compute_least_popular_items(orders=None):
    if orders is None:
        orders = load_orders()
    items = Counter()
    for o in orders:
        for item in o['items']:
            items[item] += 1
    return items.most_common()[::-1]

def compute_top_customers(customers=None):
    if customers is None:
        customers = load_customers()
    sorted_cust = sorted(customers, key=lambda c: c.get('points', 0), reverse=True)
    return sorted_cust[:10]

def compute_revenue_by_day(orders=None):
    if orders is None:
        orders = load_orders()
    rev_by_day = {}
    for o in orders:
        dt = datetime.fromisoformat(o['timestamp'])
        day_str = dt.strftime("%A")
        rev_by_day[day_str] = rev_by_day.get(day_str, 0) + o['price']
    return rev_by_day

def get_combo_opportunities():
    return get_ai_structured_insights()

def get_business_context():
    orders = load_orders()
    total_rev = compute_total_revenue(orders)
    avg_val = compute_avg_order_value(orders)
    pop_items = compute_most_popular_items(orders)
    top_items = [i[0] for i in pop_items[:3]]
    worst_items = [i[0] for i in pop_items[-3:][::-1]]
    peaks = compute_peak_hours(orders)
    peak_hour = f"{peaks[0][0]}:00" if peaks else "N/A"
    
    from backend.ai_engine.sentiment_model import analyze_orders_sentiment
    sentiment_data = analyze_orders_sentiment()
    sentiment_score = float(sentiment_data.get("score", 0.0))
    
    context = {
        "Total Revenue": f"${total_rev:.2f}",
        "Average Order Value": f"${avg_val:.2f}",
        "Top Menu Items": ", ".join(top_items),
        "Worst Menu Items": ", ".join(worst_items),
        "Peak Hours": peak_hour,
        "sentiment_score": sentiment_score,
    }
    
    if sentiment_score < -0.3:
        context["alert"] = "Customer dissatisfaction detected. Immediate action recommended."
        
    return context
