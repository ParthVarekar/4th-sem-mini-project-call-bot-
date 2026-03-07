"""
AI Training Pipeline
Orchestrates the full ChefAI Intelligence Engine pipeline:
  1. Generate mock data (if needed)
  2. Load datasets
  3. Engineer features
  4. Run combo model (Apriori)
  5. Run sales analytics model
  6. Generate structured insights
  7. Send to Gemma reasoning layer
  8. Save cached recommendations
"""

import sys
import os

# Ensure project root is on the path so `backend.*` imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def run_pipeline():
    print("=" * 50)
    print("  ChefAI Intelligence Engine -- Training Pipeline")
    print("=" * 50)

    # -- Step 1: Generate mock data if missing --
    orders_path = DATA_DIR / "orders.csv"
    if not orders_path.exists():
        print("\n[1/7] Generating mock restaurant data...")
        from backend.ai_engine.mock_data_generator import generate
        generate()
    else:
        print(f"\n[1/7] Mock data already exists at {DATA_DIR}")

    # -- Step 2: Load datasets --
    print("\n[2/7] Loading datasets...")
    from backend.ai_engine.dataset_loader import load_orders, load_menu_items
    orders = load_orders()
    menu = load_menu_items()
    print(f"  Orders: {len(orders)} rows | Menu: {len(menu)} items")

    # -- Step 3: Feature engineering --
    print("\n[3/7] Engineering features...")
    from backend.ai_engine.feature_engineering import engineer_features
    enriched = engineer_features(orders)
    print(f"  Added columns: hour, day_of_week, month, order_value, item_count")

    # -- Step 4: Combo model (Apriori) --
    print("\n[4/7] Running combo recommendation model (Apriori)...")
    from backend.ai_engine.preprocess_data import build_transaction_lists, build_encoded_df
    from backend.ai_engine.combo_model import find_combos

    transactions = build_transaction_lists(orders)
    encoded = build_encoded_df(transactions, menu["name"].tolist())
    combo_insights = find_combos(encoded)
    print(f"  Found {len(combo_insights)} combo insight(s)")
    for c in combo_insights:
        print(f"    - {' + '.join(c['items'])}  (support={c['support']})")

    # -- Step 5: Sales analytics --
    print("\n[5/7] Running sales analytics model...")
    from backend.ai_engine.sales_model import analyze_sales
    sales_insights = analyze_sales(enriched)
    print(f"  Found {len(sales_insights)} sales insight(s)")

    # -- Step 6: Merge and save structured insights --
    print("\n[6/7] Merging insights and saving...")
    from backend.ai_engine.insight_engine import merge_insights, save_insights
    merged = merge_insights(combo_insights, sales_insights)
    path = save_insights(merged)
    print(f"  [OK] Saved {len(merged['structured_insights'])} insights -> {path}")

    # -- Step 7: Gemma reasoning --
    print("\n[7/7] Generating recommendations via Gemma (Ollama)...")
    from backend.ai_engine.gemma_reasoner import generate_recommendations
    result = generate_recommendations(merged)
    print(f"  Source: {result['source']}")
    print(f"  Status: {result['status']}")

    print("\n" + "=" * 50)
    print("  Pipeline complete!")
    print("=" * 50)
    print(f"\nRecommendations preview:\n")
    print(result["recommendations"][:500])
    if len(result["recommendations"]) > 500:
        print("  ... (truncated)")

    return result


if __name__ == "__main__":
    run_pipeline()
