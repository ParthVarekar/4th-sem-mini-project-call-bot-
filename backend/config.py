import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).parent.parent

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Paths
PROMPTS_DIR = BASE_DIR / "prompts"
DATA_DIR = BASE_DIR / "data"

# Model Configuration
LLM_MODEL = "gemini-flash-latest" # Fast and capable
GenerationConfig = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
}

# Business Configuration
BUSINESS_PHONE = "+917400082627"
