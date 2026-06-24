#!/bin/bash
cd "$(dirname "$0")/backend"
PORT="${PORT:-8000}"
echo "Сервер: http://0.0.0.0:$PORT  →  фронтенд: /app"
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
