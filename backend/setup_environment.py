"""
ChefAI Intelligence Engine — Environment Setup
Checks and installs missing Python packages, and checks for Ollama.
"""

import subprocess
import sys
import shutil

REQUIRED_PACKAGES = {
    "pandas": "pandas",
    "numpy": "numpy",
    "mlxtend": "mlxtend",
    "sklearn": "scikit-learn",
    "requests": "requests",
    "uvicorn": "uvicorn",
    "fastapi": "fastapi",
}


def check_and_install():
    missing = []
    for import_name, pip_name in REQUIRED_PACKAGES.items():
        try:
            __import__(import_name)
            print(f"  [OK] {pip_name}")
        except ImportError:
            print(f"  [MISS] {pip_name} -- missing")
            missing.append(pip_name)

    if missing:
        print(f"\nInstalling {len(missing)} missing package(s)...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", *missing],
            stdout=subprocess.DEVNULL,
        )
        print("All packages installed successfully.")
    else:
        print("\nAll required packages are already installed.")


def check_ollama():
    print("\n--- Ollama Check ---")
    if shutil.which("ollama"):
        print("  [OK] Ollama is installed.")
        print("  Make sure the Ollama server is running (ollama serve).")
        print("  Run: ollama pull gemma:2b")
    else:
        print("  [MISS] Ollama is NOT installed.")
        print("  Install Ollama from: https://ollama.com")
        print("  After installation, run:")
        print("    ollama pull gemma:2b")
        print("  Then start the server:")
        print("    ollama serve")


if __name__ == "__main__":
    print("=== ChefAI Environment Setup ===\n")
    print("--- Python Packages ---")
    check_and_install()
    check_ollama()
    print("\nSetup complete.")
