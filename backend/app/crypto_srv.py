"""Серверное шифрование сообщений в БД (AES-128-CBC через Fernet).
Решает проблемы клиентского RSA: лимит размера, потеря ключей при перезагрузке,
невозможность прочитать свои сообщения."""
import base64, hashlib, os
from cryptography.fernet import Fernet

_SECRET = os.environ.get("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_ENV_VAR")
_key = base64.urlsafe_b64encode(hashlib.sha256(_SECRET.encode()).digest())
_f = Fernet(_key)

def enc(text: str) -> str:
    return _f.encrypt(text.encode()).decode()

def dec(token: str) -> str:
    try:
        return _f.decrypt(token.encode()).decode()
    except Exception:
        return "🔒 [не удалось расшифровать]"
