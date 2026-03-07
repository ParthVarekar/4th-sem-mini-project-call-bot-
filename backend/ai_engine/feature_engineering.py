"""
Feature Engineering
Reusable feature transformations for restaurant order data.
"""

import pandas as pd


def engineer_features(orders_df: pd.DataFrame) -> pd.DataFrame:
    """
    Add derived features to the orders DataFrame.

    New columns:
      - datetime   : parsed timestamp
      - hour       : hour of order (0-23)
      - day_of_week: 0=Monday … 6=Sunday
      - month      : 1-12
      - order_value: same as price (alias for clarity)
      - item_count : number of items in the order
    """
    df = orders_df.copy()

    df["datetime"] = pd.to_datetime(df["timestamp"])
    df["hour"] = df["datetime"].dt.hour
    df["day_of_week"] = df["datetime"].dt.dayofweek
    df["month"] = df["datetime"].dt.month
    df["order_value"] = df["price"]
    df["item_count"] = df["items"].apply(lambda x: len(str(x).split("|")))

    return df


if __name__ == "__main__":
    from backend.ai_engine.dataset_loader import load_orders

    orders = load_orders()
    enriched = engineer_features(orders)
    print(enriched[["order_id", "hour", "day_of_week", "month", "order_value", "item_count"]].head(10))
