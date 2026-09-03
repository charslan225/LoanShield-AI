@echo off
echo ======================================================
echo  LoanShield AI - Launching Python FastAPI on Port 8000
echo ======================================================
cd backend_fastapi
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
