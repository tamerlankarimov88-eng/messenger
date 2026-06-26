# Корпоративный чат

Мессенджер в стиле Telegram: личные и групповые чаты, голосовые, реакции, закрепления, папки, PWA.

## Быстрый старт

**Windows:** двойной клик по `start.bat`

**Linux / macOS:**
```bash
chmod +x start.sh && ./start.sh
```

Откройте в браузере: [http://localhost:8000/app/](http://localhost:8000/app/)

## Стек

- Backend: FastAPI, SQLite, WebSocket, JWT, Argon2
- Frontend: HTML/CSS/JS (PWA, mobile + desktop)

## Production

1. Скопируйте `.env.example` в `.env` и задайте `SECRET_KEY`
2. Запуск без `--reload`: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. Доступ с телефона в локальной сети: `http://<IP-компьютера>:8000/app/`

## Структура

```
backend/app/   — API и WebSocket
frontend/      — клиент (статика на /app)
uploads/       — создаётся автоматически
```
