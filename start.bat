@echo off
cd /d "%~dp0backend"
py -3 -m pip install -q -r requirements.txt
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000/app/"
py -3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
