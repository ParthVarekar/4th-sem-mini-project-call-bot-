
============================================================
  ChefAI SENTIMENT SYSTEM — FULL VALIDATION SUITE
============================================================

============================================================
  STEP 1: SINGLETON MODEL LOADING TEST
============================================================

[Call 1] Loading model for the first time...
Loading weights:   0%|          | 0/104 [00:00<?, ?it/s]Loading weights: 100%|##########| 104/104 [00:00<00:00, 8690.26it/s]
Traceback (most recent call last):
  File "<frozen runpy>", line 198, in _run_module_as_main
  File "<frozen runpy>", line 88, in _run_code
  File "C:\Users\Parth\Desktop\4th-sem-mini-project-call-bot-\tests\validate_sentiment.py", line 210, in <module>
    step5_data_validation()
    ~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\Users\Parth\Desktop\4th-sem-mini-project-call-bot-\tests\validate_sentiment.py", line 190, in step5_data_validation
    print(f"      \u2192 {result['label']} (confidence: {result['score']:.4f})")
    ~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python314\Lib\encodings\cp1252.py", line 19, in encode
    return codecs.charmap_encode(input,self.errors,encoding_table)[0]
           ~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
UnicodeEncodeError: 'charmap' codec can't encode character '\u2192' in position 6: character maps to <undefined>
MODEL LOADED
[Call 2] Calling predict_sentiment (should NOT print MODEL LOADED)...
[Call 3] Calling predict_sentiment again...
[Call 4] Calling load_model() directly again...

[PASS]: If 'MODEL LOADED' appeared exactly ONCE above, singleton works.
[FAIL]: If 'MODEL LOADED' appeared multiple times, singleton is broken.


============================================================
  STEP 2: API UNIT TESTS (5 CASES)
============================================================

  [Positive] Input: "food was amazing and service was great"
    Result: label=POSITIVE, score=0.9998806715011597
    [PASS]

  [Negative] Input: "very bad experience, slow service"
    Result: label=NEGATIVE, score=0.9997578263282776
    [PASS]

  [Neutral] Input: "the food was okay"
    Result: label=POSITIVE, score=0.9997796416282654
    [PASS]

  [Empty] Input: ""
    Result: label=NEUTRAL, score=0.0
    [PASS]

  [Long] Input: "good food good food good food good food good food ..."
    Result: label=POSITIVE, score=0.9633879661560059
    [PASS]

[ALL PASS] API TESTS PASSED

============================================================
  STEP 3: BATCH ANALYSIS TEST
============================================================

  Raw result: {
  "positive": 21,
  "negative": 33,
  "neutral": 2,
  "score": -0.2143,
  "total": 56,
  "source": "transcripts.json"
}
    [PASS] positive is int: True
    [PASS] negative is int: True
    [PASS] score is float: True
    [PASS] score in [-1, 1]: True
    [PASS] total > 0: True
    [PASS] counts match: True

  [PASS] BATCH TEST PASSED

============================================================
  STEP 4: PERFORMANCE TEST (20 CALLS)
============================================================

  Total time for 20 calls: 0.21s
  Average per call:        10.6ms
  Min:                     9.3ms
  Max:                     12.6ms

  Avg (excl. warmup):      10.6ms
  Max (excl. warmup):      12.6ms
  Variance ratio:          1.19x

  [PASS] PERFORMANCE STABLE

============================================================
  STEP 5: DATA VALIDATION (5 SAMPLES)
============================================================

  Source: transcripts.json (56 total texts)

  [1] "Hi, this is Caller 2321. I would like to make a dinner reservation."
