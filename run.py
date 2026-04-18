import sys
import os

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("[*] Booting services and verifying mock data...")
import backend.services.data_loader # This triggers the generator safely if data is missing
from backend.app import app

if __name__ == '__main__':
    print("[*] Starting Call Bot Server...")
    app.run(host='0.0.0.0', debug=True, port=5000)
