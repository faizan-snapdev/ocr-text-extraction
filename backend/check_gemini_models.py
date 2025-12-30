import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from backend/.env
# This script assumes it is located in 'backend/'
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env')

if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded .env from {env_path}")
else:
    print(f"Warning: .env not found at {env_path}")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found in environment variables.")
    # Fallback: try to read it manually if load_dotenv failed for some reason or key is missing
    try:
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY'):
                    print("Found GEMINI_API_KEY in file raw check.")
    except Exception:
        pass
else:
    print(f"API Key found: {api_key[:5]}...{api_key[-5:]}")
    try:
        genai.configure(api_key=api_key)
        print("Listing available models...")
        models = genai.list_models()
        found_target = False
        count = 0
        for m in models:
            count += 1
            print(f"Name: {m.name}")
            print(f"Supported methods: {m.supported_generation_methods}")
            print("-" * 20)
            if 'gemini-1.5-flash' in m.name:
                found_target = True
        
        print(f"Total models found: {count}")

        if found_target:
            print("\nSUCCESS: 'gemini-1.5-flash' found in list.")
        else:
            print("\nFAILURE: 'gemini-1.5-flash' NOT found in list.")

    except Exception as e:
        print(f"An error occurred: {e}")