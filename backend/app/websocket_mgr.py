import asyncio, json, logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self._conns: dict[int, list[WebSocket]] = {}

    async def connect(self, uid: int, ws: WebSocket):
        await ws.accept()
        if uid not in self._conns:
            self._conns[uid] = []
        self._conns[uid].append(ws)
        logger.info("WS connect uid=%s total=%s", uid, len(self._conns[uid]))

    async def disconnect(self, uid: int, ws: WebSocket = None):
        if uid not in self._conns:
            return
        if ws:
            try: self._conns[uid].remove(ws)
            except ValueError: pass
        else:
            self._conns.pop(uid, None)
        if not self._conns.get(uid):
            self._conns.pop(uid, None)

    def is_online(self, uid: int) -> bool:
        return uid in self._conns and len(self._conns[uid]) > 0

    async def send_encrypted_message(self, data: dict, uid: int):
        conns = self._conns.get(uid, [])
        dead = []
        for ws in conns:
            try:
                await ws.send_text(json.dumps(data))
            except Exception as e:
                logger.warning("WS send uid=%s err=%s", uid, e)
                dead.append(ws)
        for ws in dead:
            try: self._conns[uid].remove(ws)
            except: pass
        if not self._conns.get(uid):
            self._conns.pop(uid, None)

    def get_online_users(self) -> list[int]:
        return list(self._conns.keys())

manager = ConnectionManager()
