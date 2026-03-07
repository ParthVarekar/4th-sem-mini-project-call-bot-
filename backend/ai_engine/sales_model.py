"""
Sales Analytics Model
Detects peak hours, most popular items, average order value, and busiest days.
"""

import pandas as pd

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def analyze_sales(orders_df: pd.DataFrame) -> list[dict]:
    """
    Analyze the enriched orders DataFrame (must have hour, day_of_week, order_value columns).

    Returns a list of structured insight dicts.
    """
    insights: list[dict] = []

    # --- Peak Order Hours (top 3) ---
    hour_counts = orders_df.groupby("hour").size().sort_values(ascending=False)
    for hour in hour_counts.head(3).index:
        insights.append({
            "type": "peak_hour",
            "hour": int(hour),
            "order_count": int(hour_counts[hour]),
        })

    # --- Most Popular Items (top 5) ---
    all_items = orders_df["items"].str.split("|").explode().str.strip()
    item_counts = all_items.value_counts()
    for item_name in item_counts.head(5).index:
        insights.append({
            "type": "popular_item",
            "item": item_name,
            "order_count": int(item_counts[item_name]),
        })

    # --- Average Order Value ---
    avg_value = round(float(orders_df["order_value"].mean()), 2)
    insights.append({
        "type": "avg_order_value",
        "value": avg_value,
    })

    # --- Busiest Days (top 3) ---
    day_counts = orders_df.groupby("day_of_week").size().sort_values(ascending=False)
    for day in day_counts.head(3).index:
        insights.append({
            "type": "busiest_day",
            "day": DAY_NAMES[int(day)],
            "order_count": int(day_counts[day]),
        })

    return insights


if __name__ == "__main__":
    from backend.ai_engine.dataset_loader import load_orders
    from backend.ai_engine.feature_engineering import engineer_features

    orders = load_orders()
    enriched = engineer_features(orders)
    insights = analyze_sales(enriched)

    print(f"Generated {len(insights)} sales insight(s):\n")
    for ins in insights:
        print(f"  {ins}")
