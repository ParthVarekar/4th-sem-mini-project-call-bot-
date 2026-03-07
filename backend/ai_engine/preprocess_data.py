"""
Data Preprocessing
Converts order data into transaction item-lists suitable for the Apriori algorithm.
"""

import pandas as pd


def build_transaction_lists(orders_df: pd.DataFrame) -> list[list[str]]:
    """
    Convert the pipe-delimited 'items' column into a list of item-lists.

    Example:
        "Burger|Fries" → ["Burger", "Fries"]
    """
    transactions = []
    for items_str in orders_df["items"]:
        items = [i.strip() for i in str(items_str).split("|") if i.strip()]
        if items:
            transactions.append(items)
    return transactions


def build_encoded_df(transactions: list[list[str]], menu_items: list[str]) -> pd.DataFrame:
    """
    One-hot encode transactions for mlxtend Apriori.

    Returns a boolean DataFrame where columns are menu item names.
    """
    records = []
    for txn in transactions:
        row = {item: (item in txn) for item in menu_items}
        records.append(row)
    return pd.DataFrame(records)


if __name__ == "__main__":
    from backend.ai_engine.dataset_loader import load_orders, load_menu_items

    orders = load_orders()
    menu = load_menu_items()
    transactions = build_transaction_lists(orders)
    print(f"Transactions: {len(transactions)}")
    print(f"Sample: {transactions[:5]}")

    encoded = build_encoded_df(transactions, menu["name"].tolist())
    print(f"\nEncoded shape: {encoded.shape}")
    print(encoded.head())
