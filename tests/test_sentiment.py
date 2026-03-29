"""
Tests for the sentiment analysis module.
Covers single prediction, neutral threshold, preprocessing, and batch aggregation.
"""

import json
import os
import tempfile
import pytest


# ---------------------------------------------------------------------------
# Unit tests for predict_sentiment
# ---------------------------------------------------------------------------
class TestPredictSentiment:
    """Single-text prediction tests."""

    def test_positive_review(self):
        from backend.ai_engine.sentiment_model import predict_sentiment

        result = predict_sentiment("The food was absolutely amazing and delicious!")
        assert "label" in result
        assert "score" in result
        assert result["label"] in ("POSITIVE", "NEGATIVE", "NEUTRAL")
        assert 0.0 <= result["score"] <= 1.0

    def test_negative_review(self):
        from backend.ai_engine.sentiment_model import predict_sentiment

        result = predict_sentiment("Terrible service, the food was cold and disgusting.")
        assert result["label"] in ("POSITIVE", "NEGATIVE", "NEUTRAL")

    def test_empty_string_returns_neutral(self):
        from backend.ai_engine.sentiment_model import predict_sentiment

        result = predict_sentiment("")
        assert result["label"] == "NEUTRAL"
        assert result["score"] == 0.0

    def test_whitespace_only_returns_neutral(self):
        from backend.ai_engine.sentiment_model import predict_sentiment

        result = predict_sentiment("   \n\t  ")
        assert result["label"] == "NEUTRAL"

    def test_result_shape(self):
        from backend.ai_engine.sentiment_model import predict_sentiment

        result = predict_sentiment("Good food, fast delivery.")
        assert isinstance(result, dict)
        assert set(result.keys()) == {"label", "score"}


# ---------------------------------------------------------------------------
# Unit tests for preprocessing
# ---------------------------------------------------------------------------
class TestPreprocessing:
    """Verify text normalisation."""

    def test_lowercased(self):
        from backend.ai_engine.sentiment_model import _preprocess

        assert _preprocess("HELLO WORLD") == "hello world"

    def test_stripped(self):
        from backend.ai_engine.sentiment_model import _preprocess

        assert _preprocess("  hi  ") == "hi"

    def test_long_text_truncated(self):
        from backend.ai_engine.sentiment_model import _preprocess

        long_text = " ".join(["word"] * 600)
        result = _preprocess(long_text)
        assert len(result.split()) == 512


# ---------------------------------------------------------------------------
# Unit tests for batch analysis
# ---------------------------------------------------------------------------
class TestBatchAnalysis:
    """Batch aggregation structure and scoring tests."""

    def test_batch_result_shape(self):
        from backend.ai_engine.sentiment_model import analyze_orders_sentiment

        result = analyze_orders_sentiment()
        assert isinstance(result, dict)
        for key in ("positive", "negative", "neutral", "score", "total", "source"):
            assert key in result, f"Missing key: {key}"

    def test_batch_score_range(self):
        from backend.ai_engine.sentiment_model import analyze_orders_sentiment

        result = analyze_orders_sentiment()
        assert -1.0 <= result["score"] <= 1.0

    def test_batch_counts_consistent(self):
        from backend.ai_engine.sentiment_model import analyze_orders_sentiment

        result = analyze_orders_sentiment()
        assert result["total"] == (
            result["positive"] + result["negative"] + result["neutral"]
        )

    def test_empty_source_returns_safe_response(self):
        """When no data files exist, return zeros instead of crashing."""
        from backend.ai_engine import sentiment_model

        # Temporarily point DATA_DIR to an empty temp dir
        original = sentiment_model.DATA_DIR
        with tempfile.TemporaryDirectory() as tmpdir:
            sentiment_model.DATA_DIR = tmpdir
            result = sentiment_model.analyze_orders_sentiment()
            assert result["total"] == 0
            assert result["score"] == 0.0
            sentiment_model.DATA_DIR = original


# ---------------------------------------------------------------------------
# Unit tests for transcript text extraction
# ---------------------------------------------------------------------------
class TestTranscriptExtraction:
    """Verify _extract_texts_from_transcripts pulls Customer messages."""

    def test_extracts_customer_messages(self):
        from backend.ai_engine.sentiment_model import _extract_texts_from_transcripts

        sample = [
            {
                "id": 1,
                "summary": "Test call",
                "messages": [
                    {"sender": "AI", "text": "Hello"},
                    {"sender": "Customer", "text": "I want to order pizza"},
                    {"sender": "AI", "text": "Sure"},
                    {"sender": "Customer", "text": "Thank you"},
                ],
            }
        ]
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as f:
            json.dump(sample, f)
            path = f.name

        try:
            texts = _extract_texts_from_transcripts(path)
            # 2 customer messages + 1 summary = 3
            assert len(texts) == 3
            assert "I want to order pizza" in texts
            assert "Thank you" in texts
            assert "Test call" in texts
        finally:
            os.unlink(path)

    def test_handles_missing_file(self):
        from backend.ai_engine.sentiment_model import _extract_texts_from_transcripts

        texts = _extract_texts_from_transcripts("/nonexistent/path.json")
        assert texts == []
