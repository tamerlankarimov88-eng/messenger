#!/bin/bash
cd "$(dirname "$0")/backend"
py -3 -m pip install -q -r requirements.txt 2>/dev/null || python3 -m pip install -q -r requirements.txt
PORT="${PORT:-8000}"
echo "Сервер: http://0.0.0.0:$PORT  →  фронтенд: /app"
(sleep 2 && xdg-open "http://localhost:$PORT/app/" 2>/dev/null || open "http://localhost:$PORT/app/" 2>/dev/null) &
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
