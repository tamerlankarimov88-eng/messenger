# Алабуга Политех — Мессенджер

## 🚀 Деплой на Render.com

### Вариант 1: через render.yaml (Blueprint)
1. Запушь проект на GitHub
2. На dashboard.render.com → **New → Blueprint**
3. Подключи репозиторий — Render сам прочитает `render.yaml`
4. Нажми **Apply** — всё настроится автоматически

### Вариант 2: вручную (Web Service)
1. dashboard.render.com → **New → Web Service**
2. Подключи GitHub-репозиторий
3. Заполни поля:

| Поле | Значение |
|---|---|
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

4. В **Environment** добавь переменную:
   - `SECRET_KEY` = любая длинная случайная строка
5. Нажми **Create Web Service**

После деплоя сайт открывается по адресу вида `https://your-app.onrender.com` — корень автоматически редиректит на мессенджер.

⚠️ **Важно про Free план:** SQLite-база сбрасывается при каждом редеплое (эфемерный диск). Для постоянного хранения подключи Render Disk (платно) или PostgreSQL.

## 💻 Локальный запуск
```bash
cd backend
pip install -r requirements.txt
cd ..
./start.sh
# → http://localhost:8000
```
