"""
Optional fine-tuning script for the sentiment model.
Expects a CSV at backend/data/comments.csv with columns: text, label (0 or 1).

Usage:
    python -m backend.ai_engine.train_sentiment

The trained model is saved to backend/ai_engine/models/sentiment/
The system works perfectly fine without running this — the pretrained
distilbert-base-uncased-finetuned-sst-2-english model is used by default.
"""

import os
import sys


def train():
    try:
        from datasets import Dataset
        from transformers import (
            AutoModelForSequenceClassification,
            AutoTokenizer,
            Trainer,
            TrainingArguments,
        )
    except ImportError:
        print(
            "ERROR: 'transformers' and 'datasets' packages are required.\n"
            "Install with: pip install transformers datasets torch accelerate"
        )
        sys.exit(1)

    import pandas as pd

    data_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "comments.csv"
    )
    if not os.path.isfile(data_path):
        print(f"No training data found at {data_path}")
        print("Create a CSV with 'text' and 'label' columns (0=negative, 1=positive).")
        sys.exit(0)

    output_dir = os.path.join(os.path.dirname(__file__), "models", "sentiment")
    os.makedirs(output_dir, exist_ok=True)

    model_name = "distilbert-base-uncased"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, num_labels=2
    )

    df = pd.read_csv(data_path)
    if "text" not in df.columns or "label" not in df.columns:
        print("CSV must have 'text' and 'label' columns.")
        sys.exit(1)

    df = df.dropna(subset=["text", "label"])
    df["label"] = df["label"].astype(int)

    dataset = Dataset.from_pandas(df[["text", "label"]])

    def tokenize_fn(batch):
        return tokenizer(
            batch["text"], padding="max_length", truncation=True, max_length=512
        )

    dataset = dataset.map(tokenize_fn, batched=True)
    split = dataset.train_test_split(test_size=0.2, seed=42)

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=2,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_steps=10,
        load_best_model_at_end=True,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=split["train"],
        eval_dataset=split["test"],
        tokenizer=tokenizer,
    )

    print(f"Training on {len(split['train'])} samples for 2 epochs …")
    trainer.train()

    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"Model saved to {output_dir}")


if __name__ == "__main__":
    train()
