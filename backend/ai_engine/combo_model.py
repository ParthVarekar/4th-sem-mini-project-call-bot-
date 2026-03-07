"""
Combo Recommendation Model
Uses Apriori algorithm to detect frequent item combinations.
"""

from mlxtend.frequent_patterns import apriori, association_rules
import pandas as pd


def find_combos(encoded_df: pd.DataFrame,
                min_support: float = 0.05,
                min_confidence: float = 0.3,
                top_n: int = 10) -> list[dict]:
    """
    Run Apriori on the one-hot encoded transaction DataFrame.

    Returns a list of combo insight dicts:
        [{"type": "combo", "items": ["Burger", "Fries"], "support": 0.15, "confidence": 0.72}, ...]
    """
    # Find ALL frequent itemsets (single + multi)
    freq = apriori(encoded_df, min_support=min_support, use_colnames=True)

    # Need at least one multi-item itemset to generate rules
    multi_item = freq[freq["itemsets"].apply(len) >= 2]
    if multi_item.empty:
        return []

    # Generate association rules (needs full freq table for support lookups)
    rules = association_rules(freq, metric="confidence", min_threshold=min_confidence)
    # Keep only rules where the union of antecedent+consequent has 2+ items
    rules = rules[rules.apply(
        lambda r: len(r["antecedents"] | r["consequents"]) >= 2, axis=1
    )]
    rules = rules.sort_values("lift", ascending=False).head(top_n)

    combos = []
    seen = set()
    for _, row in rules.iterrows():
        items = sorted(set(row["antecedents"]) | set(row["consequents"]))
        key = tuple(items)
        if key not in seen:
            seen.add(key)
            combos.append({
                "type": "combo",
                "items": items,
                "support": round(float(row["support"]), 4),
                "confidence": round(float(row["confidence"]), 4),
            })

    return combos


if __name__ == "__main__":
    from backend.ai_engine.dataset_loader import load_orders, load_menu_items
    from backend.ai_engine.preprocess_data import build_transaction_lists, build_encoded_df

    orders = load_orders()
    menu = load_menu_items()
    txns = build_transaction_lists(orders)
    encoded = build_encoded_df(txns, menu["name"].tolist())

    combos = find_combos(encoded)
    print(f"Found {len(combos)} combo(s):\n")
    for c in combos:
        print(f"  {' + '.join(c['items'])}  (support={c['support']}, confidence={c['confidence']})")
