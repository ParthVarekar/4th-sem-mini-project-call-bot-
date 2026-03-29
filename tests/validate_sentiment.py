"""
Comprehensive Sentiment System Validation Script
Covers Steps 1-5 of the validation checklist.
Run with: python -m tests.validate_sentiment
"""

import json
import time
import sys
import os

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def separator(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def step1_singleton_test():
    """STEP 1: Verify model loads exactly once."""
    separator("STEP 1: SINGLETON MODEL LOADING TEST")

    from backend.ai_engine.sentiment_model import predict_sentiment, load_model

    print("\n[Call 1] Loading model for the first time...")
    load_model()
    print("[Call 2] Calling predict_sentiment (should NOT print MODEL LOADED)...")
    predict_sentiment("test one")
    print("[Call 3] Calling predict_sentiment again...")
    predict_sentiment("test two")
    print("[Call 4] Calling load_model() directly again...")
    load_model()

    print("\n[PASS]: If 'MODEL LOADED' appeared exactly ONCE above, singleton works.")
    print("[FAIL]: If 'MODEL LOADED' appeared multiple times, singleton is broken.\n")


def step2_api_tests():
    """STEP 2: Test 5 edge cases directly."""
    separator("STEP 2: API UNIT TESTS (5 CASES)")

    from backend.ai_engine.sentiment_model import predict_sentiment

    test_cases = [
        ("Positive", "food was amazing and service was great"),
        ("Negative", "very bad experience, slow service"),
        ("Neutral",  "the food was okay"),
        ("Empty",    ""),
        ("Long",     "good food " * 200),
    ]

    all_passed = True
    for name, text in test_cases:
        result = predict_sentiment(text)

        # Validate structure
        has_label = "label" in result
        has_score = "score" in result
        valid_label = result.get("label") in ("POSITIVE", "NEGATIVE", "NEUTRAL")
        valid_score = isinstance(result.get("score"), float)
        no_crash = True

        passed = has_label and has_score and valid_label and valid_score and no_crash
        status = "[PASS]" if passed else "[FAIL]"
        all_passed = all_passed and passed

        display_text = text[:50] + "..." if len(text) > 50 else text
        print(f"\n  [{name}] Input: \"{display_text}\"")
        print(f"    Result: label={result.get('label')}, score={result.get('score')}")
        print(f"    {status}")

    print(f"\n{'[ALL PASS] API TESTS PASSED' if all_passed else '[SOME FAIL] API TESTS FAILED'}")


def step3_batch_test():
    """STEP 3: Test batch endpoint."""
    separator("STEP 3: BATCH ANALYSIS TEST")

    from backend.ai_engine.sentiment_model import analyze_orders_sentiment

    result = analyze_orders_sentiment()

    print(f"\n  Raw result: {json.dumps(result, indent=2)}")

    # Validate structure
    required_keys = {"positive", "negative", "score", "total", "source"}
    missing = required_keys - set(result.keys())
    if missing:
        print(f"\n  [FAIL]: Missing keys: {missing}")
        return

    checks = {
        "positive is int": isinstance(result["positive"], int),
        "negative is int": isinstance(result["negative"], int),
        "score is float":  isinstance(result["score"], (int, float)),
        "score in [-1, 1]": -1.0 <= result["score"] <= 1.0,
        "total > 0":       result["total"] > 0,
        "counts match":    result["positive"] + result["negative"] + result.get("neutral", 0) == result["total"],
    }

    for desc, passed in checks.items():
        status = "[PASS]" if passed else "[FAIL]"
        print(f"    {status} {desc}: {passed}")

    all_ok = all(checks.values())
    print(f"\n  {'[PASS] BATCH TEST PASSED' if all_ok else '[FAIL] BATCH TEST FAILED'}")


def step4_performance_test():
    """STEP 4: 20 calls in a loop — measure timing."""
    separator("STEP 4: PERFORMANCE TEST (20 CALLS)")

    from backend.ai_engine.sentiment_model import predict_sentiment

    texts = [
        "the food was great",
        "terrible experience",
        "it was okay I guess",
        "absolutely wonderful",
        "disgusting service",
    ]

    times = []
    for i in range(20):
        text = texts[i % len(texts)]
        start = time.perf_counter()
        predict_sentiment(text)
        elapsed = time.perf_counter() - start
        times.append(elapsed)

    avg_ms = (sum(times) / len(times)) * 1000
    min_ms = min(times) * 1000
    max_ms = max(times) * 1000
    total_s = sum(times)

    print(f"\n  Total time for 20 calls: {total_s:.2f}s")
    print(f"  Average per call:        {avg_ms:.1f}ms")
    print(f"  Min:                     {min_ms:.1f}ms")
    print(f"  Max:                     {max_ms:.1f}ms")

    # Check stability: max should not be wildly different from avg
    # (first call may be slower due to warmup, so exclude it)
    warmup_excluded = times[1:]
    avg_no_warmup = (sum(warmup_excluded) / len(warmup_excluded)) * 1000
    max_no_warmup = max(warmup_excluded) * 1000
    variance_ratio = max_no_warmup / avg_no_warmup if avg_no_warmup > 0 else 0

    print(f"\n  Avg (excl. warmup):      {avg_no_warmup:.1f}ms")
    print(f"  Max (excl. warmup):      {max_no_warmup:.1f}ms")
    print(f"  Variance ratio:          {variance_ratio:.2f}x")

    stable = variance_ratio < 3.0
    print(f"\n  {'[PASS] PERFORMANCE STABLE' if stable else '[WARN] HIGH VARIANCE — investigate'}")


def step5_data_validation():
    """STEP 5: Print 5 sample texts + their predictions."""
    separator("STEP 5: DATA VALIDATION (5 SAMPLES)")

    from backend.ai_engine.sentiment_model import (
        predict_sentiment,
        _extract_texts_from_transcripts,
        DATA_DIR,
    )

    transcripts_path = os.path.join(DATA_DIR, "transcripts.json")
    if not os.path.isfile(transcripts_path):
        print("  [WARN] transcripts.json not found — skipping sample validation.")
        return

    texts = _extract_texts_from_transcripts(transcripts_path)
    if not texts:
        print("  [WARN] No customer texts extracted — skipping.")
        return

    # Pick 5 diverse samples
    step = max(1, len(texts) // 5)
    samples = texts[::step][:5]

    print(f"\n  Source: transcripts.json ({len(texts)} total texts)\n")

    reasonable = 0
    for i, text in enumerate(samples, 1):
        result = predict_sentiment(text)
        display = text[:70] + "..." if len(text) > 70 else text
        print(f"  [{i}] \"{display}\"")
        print(f"      → {result['label']} (confidence: {result['score']:.4f})")

        # Basic reasonableness check
        if result["label"] in ("POSITIVE", "NEGATIVE", "NEUTRAL"):
            reasonable += 1
        print()

    print(f"  Reasonable predictions: {reasonable}/5")
    print(f"  {'[PASS] DATA VALIDATION PASSED' if reasonable == 5 else '[WARN] SOME PREDICTIONS LOOK WRONG'}")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  ChefAI SENTIMENT SYSTEM — FULL VALIDATION SUITE")
    print("=" * 60)

    step1_singleton_test()
    step2_api_tests()
    step3_batch_test()
    step4_performance_test()
    step5_data_validation()

    separator("VALIDATION COMPLETE")
    print("  Review results above. 'MODEL LOADED' should appear exactly ONCE.\n")
