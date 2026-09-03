"""
LoanShield AI - Python FastAPI Backend Runner
Usage:
    python run_fastapi.py
"""

import sys
import os
import subprocess

def main():
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend_fastapi")
    if not os.path.exists(backend_dir):
        print(f"Error: backend_fastapi directory not found at {backend_dir}")
        sys.exit(1)

    print("==================================================")
    print("🚀 Starting LoanShield AI Python FastAPI Backend")
    print("📍 Host: 127.0.0.1 | Port: 8000")
    print("🌐 API Docs: http://127.0.0.1:8000/docs")
    print("==================================================")

    cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    try:
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\nFastAPI server stopped.")

if __name__ == "__main__":
    main()
