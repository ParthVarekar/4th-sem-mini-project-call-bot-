"""
Dataset Loader
Loads CSV datasets from backend/data/ into pandas DataFrames.
"""

import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def load_orders() -> pd.DataFrame:
    """Load orders.csv and return a DataFrame."""
    path = DATA_DIR / "orders.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"orders.csv not found at {path}. Run mock_data_generator first."
        )
    return pd.read_csv(path)


def load_menu_items() -> pd.DataFrame:
    """Load menu_items.csv and return a DataFrame."""
    path = DATA_DIR / "menu_items.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"menu_items.csv not found at {path}. Run mock_data_generator first."
        )
    return pd.read_csv(path)


def load_customers() -> pd.DataFrame:
    """Load customers.csv and return a DataFrame."""
    path = DATA_DIR / "customers.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"customers.csv not found at {path}. Run mock_data_generator first."
        )
    return pd.read_csv(path)


if __name__ == "__main__":
    orders = load_orders()
    menu = load_menu_items()
    customers = load_customers()
    print(f"Orders:    {len(orders)} rows")
    print(f"Menu:      {len(menu)} rows")
    print(f"Customers: {len(customers)} rows")
