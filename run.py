import sys
import os

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app import app

if __name__ == '__main__':
    print("[*] Starting Call Bot Server...")
    app.run(debug=True, port=5000)
