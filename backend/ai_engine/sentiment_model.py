"""
Sentiment Analysis Module - ChefAI
Singleton-loaded HuggingFace pipeline with neutral-zone classification,
batch analysis over transcripts.json / comments.csv, and file-level caching.
"""

import csv
import json
import os
import hashlib
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FIX 1 — Global singleton; model loads exactly ONCE
# ---------------------------------------------------------------------------
_pipeline_instance = None
_CONFIDENCE_THRESHOLD = 0.6  # FIX 5 — below this → NEUTRAL

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# FIX 6 — file-level batch cache
_batch_cache: dict = {}  # key = file_hash, value = result dict


def load_model():
    """Return the cached sentiment pipeline, creating it on first call."""
    global _pipeline_instance
    if _pipeline_instance is not None:
        return _pipeline_instance

    try:
        from transformers import pipeline as hf_pipeline

        _pipeline_instance = hf_pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=-1,  # CPU-only; safe for any machine
        )
        logger.info("Sentiment model loaded successfully (singleton)")
    except Exception as exc:
        logger.error("Failed to load sentiment model: %s", exc)
        _pipeline_instance = None

    return _pipeline_instance


# ---------------------------------------------------------------------------
# FIX 4 — Preprocessing helper (lowercase, strip, truncate 512 tokens)
# ---------------------------------------------------------------------------
def _preprocess(text: str) -> str:
    """Normalise text before inference."""
    text = str(text).lower().strip()
    # Rough word-level truncation to ~512 tokens
    words = text.split()
    if len(words) > 512:
        text = " ".join(words[:512])
    return text


# ---------------------------------------------------------------------------
# FIX 5 — Single prediction with NEUTRAL class
# ---------------------------------------------------------------------------
def predict_sentiment(text: str) -> dict:
    """
    Classify a single string.

    Returns
    -------
    {
        "label": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
        "score": float   (raw pipeline confidence, 0-1)
    }
    """
    pipe = load_model()
    if pipe is None:
        return {"label": "NEUTRAL", "score": 0.0}

    cleaned = _preprocess(text)
    if not cleaned:
        return {"label": "NEUTRAL", "score": 0.0}

    try:
        result = pipe(cleaned, truncation=True, max_length=512)[0]
    except Exception as exc:
        logger.warning("Sentiment prediction error: %s", exc)
        return {"label": "NEUTRAL", "score": 0.0}

    raw_label = result["label"]   # "POSITIVE" or "NEGATIVE"
    confidence = float(result["score"])

    # FIX 5 — low-confidence → NEUTRAL
    if confidence < _CONFIDENCE_THRESHOLD:
        return {"label": "NEUTRAL", "score": confidence}

    return {"label": raw_label, "score": confidence}


# ---------------------------------------------------------------------------
# FIX 2 — Batch data source: transcripts.json → comments.csv → empty
# ---------------------------------------------------------------------------
def _extract_texts_from_transcripts(path: str) -> list[str]:
    """Pull every Customer message from transcripts.json."""
    texts: list[str] = []
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        for entry in data:
            messages = entry.get("messages", [])
            for msg in messages:
                sender = (msg.get("sender") or "").strip()
                # Accept any sender that is NOT the AI bot or system
                if sender and sender.lower() not in ("ai", "bot", "system", "chefai"):
                    texts.append(msg["text"])
            # Also grab the top-level summary if it exists
            summary = entry.get("summary", "")
            if summary:
                texts.append(summary)
    except Exception as exc:
        logger.warning("Could not parse transcripts: %s", exc)
    return texts


def _extract_texts_from_csv(path: str) -> list[str]:
    """Read a 'text' column from a CSV (comments.csv fallback)."""
    texts: list[str] = []
    try:
        with open(path, "r", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                # Accept columns: text, comment, review, message
                for col in ("text", "comment", "review", "message"):
                    val = row.get(col, "").strip()
                    if val:
                        texts.append(val)
                        break
    except Exception as exc:
        logger.warning("Could not parse CSV: %s", exc)
    return texts


def _file_hash(path: str) -> Optional[str]:
    """Quick hash of file size + mtime for cache invalidation."""
    try:
        stat = os.stat(path)
        raw = f"{path}:{stat.st_size}:{stat.st_mtime_ns}"
        return hashlib.md5(raw.encode()).hexdigest()
    except OSError:
        return None


# ---------------------------------------------------------------------------
# FIX 3 — Correct scoring (+1 / -1 / 0 instead of raw confidence avg)
# FIX 6 — Cache batch results per file hash
# ---------------------------------------------------------------------------
def analyze_orders_sentiment() -> dict:
    """
    Batch-analyse customer text from the best available data source.

    Priority: transcripts.json → comments.csv → safe empty response.

    Returns
    -------
    {
        "positive": int,
        "negative": int,
        "neutral": int,
        "score": float   (-1.0 to +1.0),
        "total": int,
        "source": str
    }
    """
    global _batch_cache

    # --- Resolve data source (FIX 2) ---
    transcripts_path = os.path.join(DATA_DIR, "transcripts.json")
    comments_path = os.path.join(DATA_DIR, "comments.csv")

    texts: list[str] = []
    source = "none"
    cache_key: Optional[str] = None

    if os.path.isfile(transcripts_path):
        cache_key = _file_hash(transcripts_path)
        if cache_key and cache_key in _batch_cache:
            return _batch_cache[cache_key]
        texts = _extract_texts_from_transcripts(transcripts_path)
        source = "transcripts.json"
    elif os.path.isfile(comments_path):
        cache_key = _file_hash(comments_path)
        if cache_key and cache_key in _batch_cache:
            return _batch_cache[cache_key]
        texts = _extract_texts_from_csv(comments_path)
        source = "comments.csv"

    if not texts:
        return {
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "score": 0.0,
            "total": 0,
            "source": source,
        }

    # --- Run predictions ---
    positive = 0
    negative = 0
    neutral = 0
    score_sum = 0  # +1 per positive, -1 per negative, 0 per neutral

    for t in texts:
        result = predict_sentiment(t)
        label = result["label"]
        if label == "POSITIVE":
            positive += 1
            score_sum += 1
        elif label == "NEGATIVE":
            negative += 1
            score_sum -= 1
        else:
            neutral += 1
            # score_sum unchanged for neutral

    total = positive + negative + neutral
    final_score = round(score_sum / total, 4) if total else 0.0

    output = {
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
        "score": final_score,
        "total": total,
        "source": source,
    }

    # FIX 6 — store in cache
    if cache_key:
        _batch_cache[cache_key] = output

    return output
