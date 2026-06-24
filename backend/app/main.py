import json, logging, base64, os, datetime as dt
from typing import Optional, List
from fastapi import (FastAPI, Depends, HTTPException, status,
                     WebSocket, WebSocketDisconnect, Header, UploadFile, File, Request)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
import pathlib, re

from .database import engine, Base, get_db, SessionLocal
from .models import User, Message, Group, GroupMember
from .auth import hash_password, verify_password, create_access_token, verify_token
from .crypto_srv import enc, dec
from .websocket_mgr import manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
Base.metadata.create_all(bind=engine)

# ── авто-миграция старых БД ──
def _auto_migrate():
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    migs = {
        "users": {
            "display_name":"VARCHAR(128)","phone":"VARCHAR(32)","birth_date":"VARCHAR(16)",
            "avatar_emoji":"VARCHAR(16)","avatar_color":"VARCHAR(16)","avatar_b64":"TEXT",
            "theme":"VARCHAR(16)","ui_scale":"VARCHAR(16)","pinned_chats":"VARCHAR(512)",
            "folders":"TEXT","hide_online":"BOOLEAN DEFAULT 0","hide_phone":"BOOLEAN DEFAULT 0",
            "favorites":"TEXT DEFAULT '[]'","sessions":"TEXT DEFAULT '[]'"
        },
        "messages": {
            "group_id":"INTEGER","msg_type":"VARCHAR(16) DEFAULT 'text'",
            "file_name":"VARCHAR(256)","enc_text":"TEXT","reply_to_id":"INTEGER",
            "reply_preview":"VARCHAR(256)","reactions":"TEXT","pinned":"BOOLEAN DEFAULT 0",
            "is_read":"BOOLEAN DEFAULT 0","is_delivered":"BOOLEAN DEFAULT 0",
            "edited":"BOOLEAN DEFAULT 0","deleted_for_all":"BOOLEAN DEFAULT 0"
        },
        "groups": {"avatar_b64":"TEXT"},
    }
    with engine.connect() as conn:
        from sqlalchemy import text as _t
        for tbl, cols in migs.items():
            if tbl not in insp.get_table_names(): continue
            existing = {c["name"] for c in insp.get_columns(tbl)}
            for col, ddl in cols.items():
                if col not in existing:
                    try:
                        conn.execute(_t(f"ALTER TABLE {tbl} ADD COLUMN {col} {ddl}"))
                        conn.commit()
                    except Exception as e:
                        logger.warning("mig %s.%s: %s", tbl, col, e)
_auto_migrate()

app = FastAPI(title="Корпоративный чат")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

_frontend = pathlib.Path(__file__).parent.parent.parent / "frontend"
if _frontend.exists():
    app.mount("/app", StaticFiles(directory=str(_frontend), html=True), name="frontend")

@app.get("/", include_in_schema=False)
def root(): return RedirectResponse(url="/app/")

@app.get("/healthz", include_in_schema=False)
def healthz():
    return {"status": "ok", "api": 2}

# ── helpers ───────────────────────────────────────────────────
def _uid(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    p = verify_token(authorization.split(" ",1)[1])
    if not p: raise HTTPException(401, "Invalid or expired token")
    return p["user_id"]

def _user(uid: int, db: Session) -> User:
    u = db.query(User).filter(User.id==uid).first()
    if not u: raise HTTPException(404, "User not found")
    return u

PHONE_RE = re.compile(r'^\+7\d{10}$')
def norm_phone(raw: str) -> Optional[str]:
    if not raw: return None
    d = re.sub(r'\D','',raw)
    if d.startswith('8'): d = '7'+d[1:]
    if d.startswith('9') and len(d)==10: d = '7'+d
    if not d.startswith('7') or len(d)!=11: return None
    return '+'+d

PW_RE = re.compile(r'^[A-Za-z0-9!@#$%^&*()_\-+=\[\]{};:,.<>?/\\|~`\'"]+$')
def check_password(p: str):
    if len(p) < 8: raise HTTPException(422, "Пароль минимум 8 символов")
    if len(p) > 64: raise HTTPException(422, "Пароль максимум 64 символа")
    if not PW_RE.match(p): raise HTTPException(422, "Пароль: только латиница, цифры и символы")

def iso_utc(ts: dt.datetime) -> str:
    if ts.tzinfo is None: ts = ts.replace(tzinfo=dt.timezone.utc)
    return ts.isoformat()

# ── schemas ───────────────────────────────────────────────────
class PhoneCheck(BaseModel): phone: str
class RegisterIn(BaseModel):
    phone: str; username: str; password: str
    display_name: Optional[str] = None
class LoginIn(BaseModel): login: str; password: str
class RecoverIn(BaseModel): phone: str; new_password: str
class ProfileUpd(BaseModel):
    display_name: Optional[str]=None; avatar_emoji: Optional[str]=None
    avatar_color: Optional[str]=None; avatar_b64: Optional[str]=None
    theme: Optional[str]=None; ui_scale: Optional[str]=None
    birth_date: Optional[str]=None; folders: Optional[str]=None
    hide_online: Optional[bool]=None; hide_phone: Optional[bool]=None
class GroupIn(BaseModel):
    name: str; avatar_emoji: Optional[str]="👥"; avatar_b64: Optional[str]=None
    member_ids: List[int]=[]
class GroupMembersIn(BaseModel):
    member_ids: List[int]=[]
class GroupMemberRemoveIn(BaseModel):
    user_id: int
class MsgEdit(BaseModel): text: str
class PinChat(BaseModel): chat_key: str; pinned: bool
class ReactIn(BaseModel): emoji: str
class FavIn(BaseModel): msg_id: int; add: bool
class ReadIn(BaseModel): msg_id: int
class TypingIn(BaseModel):
    recipient_id: Optional[int]=None
    group_id: Optional[int]=None
    typing: bool=True
class SendMsgIn(BaseModel):
    text: str
    msg_type: str = "text"
    file_name: Optional[str] = None
    caption: Optional[str] = None
    recipient_id: Optional[int] = None
    group_id: Optional[int] = None
    temp_id: Optional[str] = None
    reply_to_id: Optional[int] = None
    reply_preview: Optional[str] = None

def _user_pub(u: User, viewer_id: int = None):
    show_phone = not u.hide_phone or viewer_id == u.id
    return {"id":u.id,"username":u.username,"display_name":u.display_name or u.username,
            "avatar_emoji":u.avatar_emoji or "😊","avatar_color":u.avatar_color or "#2E86DE",
            "avatar_b64":u.avatar_b64,
            "phone": u.phone if show_phone else None,
            "birth_date":u.birth_date,
            "hide_online": bool(u.hide_online)}

def _me_payload(u: User, token=None):
    d = {**_user_pub(u, u.id),
         "user_id": u.id,
         "theme":u.theme or "dark","ui_scale":u.ui_scale or "100",
         "pinned_chats":u.pinned_chats or "","folders":u.folders or "{}",
         "hide_online": bool(u.hide_online), "hide_phone": bool(u.hide_phone),
         "favorites": u.favorites or "[]"}
    if token: d["token"]=token
    return d

# ── AUTH ──────────────────────────────────────────────────────
@app.post("/api/check_phone")
def check_phone(data: PhoneCheck, db: Session = Depends(get_db)):
    ph = norm_phone(data.phone)
    if not ph: raise HTTPException(422, "Номер должен начинаться с +7 или 8/9 и содержать 11 цифр")
    u = db.query(User).filter(User.phone==ph).first()
    return {"exists": bool(u), "phone": ph, "username": u.username if u else None}

@app.post("/api/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    ph = norm_phone(data.phone)
    if not ph: raise HTTPException(422, "Некорректный номер")
    un = data.username.strip().lstrip('@')
    if len(un)<5: raise HTTPException(422, "Username минимум 5 символов")
    if len(un)>32: raise HTTPException(422, "Username максимум 32 символа")
    if not re.match(r'^[A-Za-z][A-Za-z0-9_]*$', un): raise HTTPException(422, "Username должен начинаться с буквы; латиница, цифры, _")
    if '__' in un or un.endswith('_'): raise HTTPException(422, "Username не может содержать __ или заканчиваться на _")
    check_password(data.password)
    if db.query(User).filter(User.phone==ph).first(): raise HTTPException(400, "Телефон уже зарегистрирован")
    if db.query(User).filter(User.username==un).first(): raise HTTPException(400, "Username занят")
    dn = (data.display_name or un).strip()[:64]
    if len(dn) < 1: dn = un
    u = User(username=un, phone=ph, hashed_password=hash_password(data.password),
             display_name=dn)
    db.add(u); db.commit(); db.refresh(u)
    token = create_access_token({"user_id":u.id,"username":u.username})
    return _me_payload(u, token)

@app.post("/api/login")
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    lg = data.login.strip()
    ph = norm_phone(lg)
    u = None
    if ph: u = db.query(User).filter(User.phone==ph).first()
    if not u: u = db.query(User).filter(User.username==lg).first()
    if not u or not verify_password(data.password, u.hashed_password):
        raise HTTPException(401, "Неверный логин или пароль")
    token = create_access_token({"user_id":u.id,"username":u.username})
    # сохраняем сессию
    try:
        ua = request.headers.get("User-Agent","")
        ip = request.client.host if request.client else "?"
        sessions = json.loads(u.sessions or "[]")
        sessions.append({"ip":ip,"ua":ua[:120],"ts":iso_utc(dt.datetime.now(dt.timezone.utc)),"token_prefix":token[:10]})
        if len(sessions) > 10: sessions = sessions[-10:]
        u.sessions = json.dumps(sessions)
        db.commit()
    except Exception: pass
    return _me_payload(u, token)

@app.post("/api/recover")
def recover(data: RecoverIn, db: Session = Depends(get_db)):
    ph = norm_phone(data.phone)
    if not ph: raise HTTPException(422, "Некорректный номер")
    u = db.query(User).filter(User.phone==ph).first()
    if not u: raise HTTPException(404, "Пользователь с таким номером не найден")
    check_password(data.new_password)
    u.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"status":"ok","username":u.username}

# ── PROFILE ───────────────────────────────────────────────────
@app.get("/api/me")
def me(db: Session = Depends(get_db), uid: int = Depends(_uid)):
    return _me_payload(_user(uid, db))

@app.patch("/api/me")
async def upd_me(d: ProfileUpd, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    u = _user(uid, db)
    visual_changed = False
    for f in ("display_name","avatar_emoji","avatar_color","avatar_b64","theme","ui_scale",
              "birth_date","folders","hide_online","hide_phone"):
        v = getattr(d, f)
        if v is not None:
            if f == "avatar_b64" and v == "":
                v = None
            if f in ("display_name","avatar_emoji","avatar_color","avatar_b64") and getattr(u, f) != v:
                visual_changed = True
            setattr(u, f, v)
    db.commit(); db.refresh(u)
    # push my new public profile to everyone who has a DM with me
    if visual_changed:
        partner_ids = set()
        for (s, r) in db.query(Message.sender_id, Message.recipient_id).filter(
                Message.group_id==None,
                or_(Message.sender_id==uid, Message.recipient_id==uid)).all():
            partner_ids.add(s); partner_ids.add(r)
        partner_ids.discard(uid); partner_ids.discard(None)
        ev = {"event":"profile", **_user_pub(u)}
        for pid in partner_ids:
            await manager.send_encrypted_message(ev, pid)
    return {"status":"ok"}

@app.get("/api/users/{user_id}")
def user_profile(user_id: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    return _user_pub(_user(user_id, db), uid)

@app.get("/api/users")
def users(q: str = "", db: Session = Depends(get_db), uid: int = Depends(_uid)):
    qs = db.query(User)
    if q:
        like = f"%{q}%"
        qs = qs.filter(or_(User.username.ilike(like), User.display_name.ilike(like)))
    return [_user_pub(u, uid) for u in qs.limit(50).all()]

@app.get("/api/sessions")
def get_sessions(db: Session = Depends(get_db), uid: int = Depends(_uid)):
    u = _user(uid, db)
    try: return json.loads(u.sessions or "[]")
    except: return []

@app.post("/api/sessions/clear")
def clear_sessions(db: Session = Depends(get_db), uid: int = Depends(_uid)):
    u = _user(uid, db)
    # оставляем только последнюю сессию
    try:
        sessions = json.loads(u.sessions or "[]")
        if sessions: sessions = [sessions[-1]]
    except: sessions = []
    u.sessions = json.dumps(sessions)
    db.commit()
    return {"status":"ok","remaining":len(sessions)}

@app.post("/api/pin")
def pin(d: PinChat, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    u = _user(uid, db)
    pins = set((u.pinned_chats or "").split(","))-{""}
    (pins.add if d.pinned else pins.discard)(d.chat_key)
    u.pinned_chats = ",".join(pins); db.commit()
    return {"pinned_chats": u.pinned_chats}

# ── FAVORITES ─────────────────────────────────────────────────
@app.post("/api/favorites")
def toggle_fav(d: FavIn, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    u = _user(uid, db)
    try: favs = json.loads(u.favorites or "[]")
    except: favs = []
    if d.add:
        if d.msg_id not in favs: favs.append(d.msg_id)
    else:
        favs = [x for x in favs if x != d.msg_id]
    u.favorites = json.dumps(favs); db.commit()
    return {"favorites": favs}

@app.get("/api/favorites")
def get_favs(db: Session = Depends(get_db), uid: int = Depends(_uid)):
    u = _user(uid, db)
    try: fav_ids = json.loads(u.favorites or "[]")
    except: fav_ids = []
    msgs = db.query(Message).filter(Message.id.in_(fav_ids),
                                    Message.deleted_for_all==False).all()
    return [_mdict(m) for m in msgs]

# ── TYPING ────────────────────────────────────────────────────
@app.post("/api/typing")
async def typing(d: TypingIn, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    u = _user(uid, db)
    ev = {"event":"typing","sender_id":uid,"display_name":u.display_name or u.username,
          "typing":d.typing,"group_id":d.group_id,"recipient_id":d.recipient_id}
    if d.group_id:
        for mem in db.query(GroupMember).filter(GroupMember.group_id==d.group_id,
                                                 GroupMember.user_id!=uid).all():
            await manager.send_encrypted_message(ev, mem.user_id)
    elif d.recipient_id:
        rid = int(d.recipient_id)
        if rid != uid:
            await manager.send_encrypted_message(ev, rid)
    return {"ok":True}

# ── CHATS ─────────────────────────────────────────────────────
@app.get("/api/chats")
def chats(db: Session = Depends(get_db), uid: int = Depends(_uid)):
    partner_ids = set()
    for m in db.query(Message.sender_id, Message.recipient_id).filter(
        Message.group_id==None,
        or_(Message.sender_id==uid, Message.recipient_id==uid)).all():
        partner_ids.add(m[0] if m[0]!=uid else m[1])
    partner_ids.discard(uid); partner_ids.discard(None)
    out = []
    for pid in partner_ids:
        u = db.query(User).filter(User.id==pid).first()
        if not u: continue
        last = db.query(Message).filter(Message.group_id==None, or_(
            and_(Message.sender_id==uid, Message.recipient_id==pid),
            and_(Message.sender_id==pid, Message.recipient_id==uid)
        )).order_by(Message.timestamp.desc()).first()
        unread = db.query(Message).filter(Message.sender_id==pid,
            Message.recipient_id==uid, Message.is_read==False,
            Message.deleted_for_all==False).count()
        # черновики хранятся на клиенте
        last_text = ""
        if last and not last.deleted_for_all:
            last_text = _msg_preview(last)
        out.append({**_user_pub(u, uid), "chat_key":f"dm_{u.id}",
            "last_text": last_text,
            "last_ts": iso_utc(last.timestamp) if last else None, "unread": unread})
    out.sort(key=lambda x: x["last_ts"] or "", reverse=True)

    # ── Saved Messages (self-chat) — всегда присутствует, как в Telegram ──
    me = db.query(User).filter(User.id==uid).first()
    saved_last = db.query(Message).filter(
        Message.group_id==None, Message.sender_id==uid, Message.recipient_id==uid,
        Message.deleted_for_all==False).order_by(Message.timestamp.desc()).first()
    saved_text = ""
    if saved_last and not saved_last.deleted_for_all:
        saved_text = _msg_preview(saved_last)
    saved = {"id": uid, "username": me.username if me else "saved",
             "display_name": "Избранное", "is_saved": True,
             "avatar_emoji": "🔖", "avatar_color": "#2AABEE", "avatar_b64": None,
             "phone": None, "birth_date": None, "hide_online": True,
             "chat_key": "saved", "last_text": saved_text,
             "last_ts": iso_utc(saved_last.timestamp) if saved_last else None, "unread": 0}
    out.insert(0, saved)
    return out

# ── MESSAGES ──────────────────────────────────────────────────
def _pack_body(data: str, msg_type: str, caption: str = "") -> str:
    cap = (caption or "").strip()
    if cap and msg_type in ("image", "file"):
        return json.dumps({"d": data, "c": cap[:500]}, ensure_ascii=False)
    return data

def _unpack_body(m: Message):
    raw = "" if m.deleted_for_all else dec(m.enc_text)
    if m.msg_type in ("image", "file") and raw.startswith("{"):
        try:
            o = json.loads(raw)
            if isinstance(o, dict) and "d" in o:
                return o["d"], (o.get("c") or "").strip()
        except Exception:
            pass
    return raw, ""

def _msg_preview(m: Message) -> str:
    text, caption = _unpack_body(m)
    if caption:
        return caption[:60]
    if m.msg_type == "voice":
        return "🎤 Голосовое"
    if m.msg_type == "file":
        return f"📎 {m.file_name or 'Файл'}"
    if m.msg_type == "image":
        return "🖼️ Изображение"
    return text[:60]

def _mdict(m: Message, db: Session = None):
    text, caption = _unpack_body(m)
    return {"id":m.id,"sender_id":m.sender_id,"recipient_id":m.recipient_id,
            "group_id":m.group_id,"text":text,"caption":caption or None,"msg_type":m.msg_type,
            "file_name":m.file_name,"reply_to_id":m.reply_to_id,
            "reply_preview": dec(m.reply_preview) if m.reply_preview else None,
            "reactions": json.loads(m.reactions or "{}"),
            "pinned":m.pinned,"is_read":m.is_read,"is_delivered":m.is_delivered,
            "edited":m.edited,"deleted":m.deleted_for_all,
            "timestamp":iso_utc(m.timestamp)}

def _msg_targets(m: Message, db: Session):
    """All user ids that should receive a live update about this message."""
    if m.group_id:
        return [mem.user_id for mem in
                db.query(GroupMember).filter(GroupMember.group_id==m.group_id).all()]
    return list({m.sender_id, m.recipient_id} - {None})

async def _broadcast(ev: dict, targets):
    for t in targets:
        if t is not None:
            await manager.send_encrypted_message(ev, t)

async def _broadcast_presence(uid: int, online: bool, db: Session, ws: WebSocket = None):
    """Push online/offline to chat partners; optionally seed snapshot to the connecting socket."""
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        return
    ev = {"event": "presence", "user_id": uid, "online": online}
    partner_ids = set()
    for (s, r) in db.query(Message.sender_id, Message.recipient_id).filter(
            Message.group_id == None,
            or_(Message.sender_id == uid, Message.recipient_id == uid)).all():
        partner_ids.add(s if s != uid else r)
    for gid_row in db.query(GroupMember.group_id).filter(GroupMember.user_id == uid).all():
        for mem in db.query(GroupMember.user_id).filter(GroupMember.group_id == gid_row.group_id).all():
            partner_ids.add(mem.user_id)
    partner_ids.discard(uid)
    partner_ids.discard(None)
    if online and not u.hide_online:
        for pid in partner_ids:
            if manager.is_online(pid):
                await manager.send_encrypted_message(ev, pid)
    elif not online:
        for pid in partner_ids:
            if manager.is_online(pid):
                await manager.send_encrypted_message(ev, pid)
    if ws and online:
        snap = {"event": "presence_snapshot", "online": []}
        for oid in manager.get_online_users():
            if oid == uid:
                continue
            ou = db.query(User).filter(User.id == oid).first()
            if ou and (not ou.hide_online or oid == uid):
                snap["online"].append(oid)
        try:
            await ws.send_text(json.dumps(snap))
        except Exception:
            pass

async def _persist_message(uid: int, msg: dict):
    """Store a message and push it to recipients. Shared by WebSocket and REST send."""
    text = str(msg.get("text", ""))[:200000]
    if not text:
        raise HTTPException(422, "Пустое сообщение")
    mtype = msg.get("msg_type", "text")
    fname = msg.get("file_name")
    caption = str(msg.get("caption") or "")[:500]
    gid = msg.get("group_id")
    rid = msg.get("recipient_id")
    tmp = msg.get("temp_id")
    r2id = msg.get("reply_to_id")
    r2pv = (msg.get("reply_preview") or "")[:200]

    db = SessionLocal()
    try:
        body = _pack_body(text, mtype, caption)
        kw = dict(sender_id=uid, enc_text=enc(body), msg_type=mtype, file_name=fname,
                  reply_to_id=r2id, reply_preview=enc(r2pv) if r2pv else None)
        if gid:
            gid = int(gid)
            if not db.query(GroupMember).filter_by(group_id=gid, user_id=uid).first():
                raise HTTPException(403, "Нет доступа к группе")
            m = Message(group_id=gid, is_delivered=False, **kw)
            db.add(m); db.commit(); db.refresh(m)
            out = {**_mdict(m), "event": "message", "temp_id": tmp}
            targets = [mem.user_id for mem in
                       db.query(GroupMember).filter(GroupMember.group_id == gid).all()]
        else:
            rid = int(rid) if rid else uid
            if not db.query(User).filter(User.id == rid).first():
                raise HTTPException(404, "Получатель не найден")
            if rid == uid:
                m = Message(recipient_id=uid, is_read=True, is_delivered=True, **kw)
                db.add(m); db.commit(); db.refresh(m)
                out = {**_mdict(m), "event": "message", "temp_id": tmp}
                targets = [uid]
            else:
                m = Message(recipient_id=rid, is_delivered=False, **kw)
                db.add(m); db.commit(); db.refresh(m)
                out = {**_mdict(m), "event": "message", "temp_id": tmp}
                targets = [rid, uid]
    finally:
        db.close()
    for t in targets:
        await manager.send_encrypted_message(out, t)
    return out

@app.post("/api/messages/send")
async def send_message(data: SendMsgIn, uid: int = Depends(_uid)):
    return await _persist_message(uid, data.model_dump())

@app.get("/api/messages/{other}")
async def dm_history(other: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    msgs = db.query(Message).filter(Message.group_id==None, or_(
        and_(Message.sender_id==uid, Message.recipient_id==other),
        and_(Message.sender_id==other, Message.recipient_id==uid)
    )).order_by(Message.timestamp.asc()).all()
    newly_read_max = 0
    for m in msgs:
        if m.recipient_id==uid and not m.is_read:
            m.is_read=True
            if m.id > newly_read_max: newly_read_max = m.id
        if m.sender_id==uid and not m.is_delivered:
            m.is_delivered=True
    db.commit()
    # tell the other person their messages were read (live blue ticks)
    if newly_read_max:
        await manager.send_encrypted_message(
            {"event":"read","msg_id":newly_read_max,"reader_id":uid}, other)
    return [_mdict(m) for m in msgs]

@app.post("/api/messages/{mid}/read")
async def mark_read(mid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    # Works for BOTH direct and group messages. Group messages have recipient_id=None,
    # so the old recipient-only filter never marked them read.
    m = db.query(Message).filter(Message.id==mid).first()
    if not m:
        return {"ok": True}

    if m.group_id:
        if not db.query(GroupMember).filter_by(group_id=m.group_id, user_id=uid).first():
            return {"ok": True}
        unread_msgs = db.query(Message).filter(
            Message.group_id==m.group_id, Message.sender_id!=uid,
            Message.is_read==False, Message.id<=mid
        ).all()
        senders = set()
        for msg in unread_msgs:
            msg.is_read = True; senders.add(msg.sender_id)
        db.commit()
        ev = {"event":"read","msg_id":mid,"reader_id":uid,"group_id":m.group_id}
        for s in senders:
            await manager.send_encrypted_message(ev, s)
        return {"ok": True, "marked": len(unread_msgs)}

    # direct message
    if m.recipient_id != uid:
        return {"ok": True}
    sender_id = m.sender_id
    unread_msgs = db.query(Message).filter(
        Message.recipient_id==uid, Message.sender_id==sender_id,
        Message.is_read==False, Message.id<=mid
    ).all()
    for msg in unread_msgs:
        msg.is_read = True
    db.commit()
    ev = {"event":"read","msg_id":mid,"reader_id":uid}
    await manager.send_encrypted_message(ev, sender_id)
    return {"ok": True, "marked": len(unread_msgs)}

@app.get("/api/groups/{gid}/messages")
async def grp_history(gid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    if not db.query(GroupMember).filter_by(group_id=gid, user_id=uid).first():
        raise HTTPException(403, "Not a member")
    msgs = db.query(Message).filter(Message.group_id==gid).order_by(Message.timestamp.asc()).all()
    # помечаем доставленными И прочитанными (мы открыли чат)
    senders = set()
    for m in msgs:
        if m.sender_id != uid:
            if not m.is_delivered: m.is_delivered = True
            if not m.is_read:
                m.is_read = True; senders.add(m.sender_id)
    db.commit()
    out = [_mdict(m) for m in msgs]
    if msgs:
        ev = {"event":"read","msg_id":msgs[-1].id,"reader_id":uid,"group_id":gid}
        for s in senders:
            await manager.send_encrypted_message(ev, s)
    return out

@app.delete("/api/messages/{mid}")
async def del_msg(mid: int, for_all: bool = False,
            db: Session = Depends(get_db), uid: int = Depends(_uid)):
    m = db.query(Message).filter(Message.id==mid).first()
    if not m: raise HTTPException(404, "Сообщение не найдено")
    now = dt.datetime.now(dt.timezone.utc)
    ts = m.timestamp if m.timestamp.tzinfo else m.timestamp.replace(tzinfo=dt.timezone.utc)
    age = (now-ts).total_seconds()
    if for_all:
        if m.sender_id != uid:
            if not m.group_id or not _is_group_admin(m.group_id, uid, db):
                raise HTTPException(403, "Удалить у всех может только отправитель или админ группы")
        m.deleted_for_all = True; db.commit()
        ev = {"event":"deleted","id":m.id,"group_id":m.group_id,"recipient_id":m.recipient_id,"sender_id":m.sender_id}
        if m.group_id:
            for mem in db.query(GroupMember).filter(GroupMember.group_id==m.group_id).all():
                await manager.send_encrypted_message(ev, mem.user_id)
        else:
            await manager.send_encrypted_message(ev, m.recipient_id)
            await manager.send_encrypted_message(ev, m.sender_id)
        return {"status":"deleted_for_all"}
    if m.sender_id==uid or (m.recipient_id==uid and age<=7200):
        db.delete(m); db.commit()
        ev = {"event":"deleted","id":m.id,"group_id":m.group_id,
              "recipient_id":m.recipient_id,"sender_id":m.sender_id,"self_only":True}
        await manager.send_encrypted_message(ev, uid)
        return {"status":"deleted"}
    raise HTTPException(403, "Можно удалить только в течение 2 часов")

@app.patch("/api/messages/{mid}")
async def edit_msg(mid: int, d: MsgEdit, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    m = db.query(Message).filter(Message.id==mid, Message.sender_id==uid).first()
    if not m: raise HTTPException(404, "Сообщение не найдено или не ваше")
    # голосовые/медиа/файлы редактировать нельзя — меняется только текст
    if m.msg_type != "text":
        raise HTTPException(403, "Это сообщение нельзя редактировать")
    now = dt.datetime.now(dt.timezone.utc)
    ts = m.timestamp if m.timestamp.tzinfo else m.timestamp.replace(tzinfo=dt.timezone.utc)
    if (now-ts).total_seconds() > 86400: raise HTTPException(403, "Редактирование доступно 24 часа")
    m.enc_text = enc(d.text); m.edited = True; db.commit(); db.refresh(m)
    md = _mdict(m)
    await _broadcast({"event":"edited", **md}, _msg_targets(m, db))
    return md

@app.post("/api/messages/{mid}/pin")
async def pin_msg(mid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    m = db.query(Message).filter(Message.id==mid).first()
    if not m: raise HTTPException(404, "Не найдено")
    m.pinned = not m.pinned; db.commit()
    await _broadcast({"event":"pinned","id":m.id,"pinned":m.pinned,
                      "group_id":m.group_id,"recipient_id":m.recipient_id,
                      "sender_id":m.sender_id}, _msg_targets(m, db))
    return {"pinned": m.pinned}

@app.post("/api/messages/{mid}/react")
async def react(mid: int, d: ReactIn, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    m = db.query(Message).filter(Message.id==mid).first()
    if not m: raise HTTPException(404, "Не найдено")
    r = json.loads(m.reactions or "{}")
    lst = r.get(d.emoji, [])
    if uid in lst: lst.remove(uid)
    else: lst.append(uid)
    if lst: r[d.emoji]=lst
    elif d.emoji in r: del r[d.emoji]
    m.reactions = json.dumps(r); db.commit()
    await _broadcast({"event":"reaction","id":m.id,"reactions":r,
                      "group_id":m.group_id,"recipient_id":m.recipient_id,
                      "sender_id":m.sender_id}, _msg_targets(m, db))
    return {"reactions": r}

@app.get("/api/pinned/{chat_type}/{chat_id}")
def pinned_msgs(chat_type: str, chat_id: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    q = db.query(Message).filter(Message.pinned==True, Message.deleted_for_all==False)
    if chat_type=="g": q = q.filter(Message.group_id==chat_id)
    else: q = q.filter(Message.group_id==None, or_(
        and_(Message.sender_id==uid, Message.recipient_id==chat_id),
        and_(Message.sender_id==chat_id, Message.recipient_id==uid)))
    return [_mdict(m) for m in q.order_by(Message.timestamp.asc()).all()]

# ── FILES ─────────────────────────────────────────────────────
_updir = pathlib.Path(__file__).parent.parent.parent / "uploads"
_updir.mkdir(exist_ok=True)

IMAGE_EXTS = {'jpg','jpeg','png','gif','webp','bmp','svg'}

@app.post("/api/upload")
async def upload(file: UploadFile = File(...), uid: int = Depends(_uid)):
    content = await file.read()
    if len(content) > 50*1024*1024: raise HTTPException(413, "Максимум 50 МБ")
    ext = (file.filename.split('.')[-1] or '').lower()
    msg_type = 'image' if ext in IMAGE_EXTS else 'file'
    mime = file.content_type or ("image/"+ext if msg_type=='image' else "application/octet-stream")
    b64 = base64.b64encode(content).decode()
    # full data URL — directly usable as <img src> or download href
    data_url = f"data:{mime};base64,{b64}"
    return {"file_name": file.filename,
            "data_b64": data_url,
            "size": len(content),
            "msg_type": msg_type,
            "mime": mime}

# ── GROUPS ────────────────────────────────────────────────────
@app.post("/api/groups", status_code=201)
async def mk_group(d: GroupIn, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    if len(d.name.strip())<2: raise HTTPException(422, "Название слишком короткое")
    g = Group(name=d.name.strip(), creator_id=uid, avatar_emoji=d.avatar_emoji, avatar_b64=d.avatar_b64)
    db.add(g); db.flush()
    member_ids = []
    for mid in set([uid]+d.member_ids):
        if db.query(User).filter(User.id==mid).first():
            db.add(GroupMember(group_id=g.id, user_id=mid, is_admin=(mid==uid)))
            member_ids.append(mid)
    db.commit(); db.refresh(g)
    # tell every member (incl. the ones just added) to refresh their group list
    ev = {"event":"group_update","group_id":g.id,"name":g.name}
    for mid in member_ids:
        await manager.send_encrypted_message(ev, mid)
    return {"id":g.id,"name":g.name,"avatar_emoji":g.avatar_emoji}

@app.get("/api/groups/{gid}")
def get_group(gid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    gm = db.query(GroupMember).filter_by(group_id=gid, user_id=uid).first()
    if not gm: raise HTTPException(404, "Группа не найдена или нет доступа")
    g = db.query(Group).filter(Group.id==gid).first()
    if not g: raise HTTPException(404, "Группа не найдена")
    cnt = db.query(GroupMember).filter(GroupMember.group_id==gid).count()
    last = db.query(Message).filter(Message.group_id==gid).order_by(Message.timestamp.desc()).first()
    last_text = ""
    if last and not last.deleted_for_all:
        last_text = _msg_preview(last)
    unread = db.query(Message).filter(Message.group_id==gid,
        Message.sender_id!=uid, Message.is_read==False,
        Message.deleted_for_all==False).count()
    return {"id": g.id, "name": g.name, "avatar_emoji": g.avatar_emoji,
            "avatar_b64": g.avatar_b64, "member_count": cnt, "is_admin": gm.is_admin,
            "last_text": last_text,
            "last_ts": iso_utc(last.timestamp) if last else None, "unread": unread}

@app.get("/api/groups")
def my_groups(db: Session = Depends(get_db), uid: int = Depends(_uid)):
    out=[]
    for gm in db.query(GroupMember).filter(GroupMember.user_id==uid).all():
        g = db.query(Group).filter(Group.id==gm.group_id).first()
        if g:
            cnt = db.query(GroupMember).filter(GroupMember.group_id==g.id).count()
            last = db.query(Message).filter(Message.group_id==g.id).order_by(Message.timestamp.desc()).first()
            unread = db.query(Message).filter(Message.group_id==g.id,
                Message.sender_id!=uid, Message.is_read==False,
                Message.deleted_for_all==False).count()
            last_text = ""
            if last and not last.deleted_for_all:
                last_text = _msg_preview(last)
            out.append({"id":g.id,"name":g.name,"avatar_emoji":g.avatar_emoji,
                        "avatar_b64":g.avatar_b64,"member_count":cnt,"is_admin":gm.is_admin,
                        "last_text":last_text,
                        "last_ts":iso_utc(last.timestamp) if last else None,
                        "unread":unread})
    return out

@app.get("/api/groups/{gid}/members")
def grp_members(gid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    if not db.query(GroupMember).filter_by(group_id=gid, user_id=uid).first():
        raise HTTPException(403, "Not a member")
    out=[]
    for gm in db.query(GroupMember).filter(GroupMember.group_id==gid).all():
        u = db.query(User).filter(User.id==gm.user_id).first()
        if u: out.append({**_user_pub(u, uid), "user_id": u.id, "is_admin": gm.is_admin})
    return out

def _is_group_admin(gid: int, uid: int, db: Session) -> bool:
    gm = db.query(GroupMember).filter_by(group_id=gid, user_id=uid).first()
    return bool(gm and gm.is_admin)

def _group_member_ids(gid: int, db: Session) -> List[int]:
    return [gm.user_id for gm in db.query(GroupMember).filter(GroupMember.group_id==gid).all()]

async def _notify_group_members(gid: int, ev: dict, db: Session):
    for mid in _group_member_ids(gid, db):
        await manager.send_encrypted_message(ev, mid)

def _shared_items(base_q, kind: str):
    if kind == "links":
        url_re = re.compile(r'https?://[^\s<>"\'\]]+')
        out, seen = [], set()
        for m in base_q.order_by(Message.timestamp.desc()).limit(500).all():
            text, caption = _unpack_body(m)
            for src in (text or "", caption or ""):
                for url in url_re.findall(src):
                    url = url.rstrip('.,;:!?)')
                    if url in seen:
                        continue
                    seen.add(url)
                    out.append({"id": m.id, "url": url, "timestamp": iso_utc(m.timestamp)})
                    if len(out) >= 200:
                        return out
        return out
    type_map = {"media": "image", "files": "file", "voice": "voice"}
    mtype = type_map.get(kind, "image")
    q = base_q.filter(Message.msg_type == mtype).order_by(Message.timestamp.desc()).limit(200).all()
    return [_mdict(m) for m in q]

@app.post("/api/groups/{gid}/members")
async def add_group_members(gid: int, d: GroupMembersIn, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    if not _is_group_admin(gid, uid, db):
        raise HTTPException(403, "Только админ может добавлять участников")
    if not db.query(Group).filter(Group.id==gid).first():
        raise HTTPException(404, "Группа не найдена")
    added = []
    for mid in set(d.member_ids):
        if mid == uid:
            continue
        if not db.query(User).filter(User.id==mid).first():
            continue
        if db.query(GroupMember).filter_by(group_id=gid, user_id=mid).first():
            continue
        db.add(GroupMember(group_id=gid, user_id=mid, is_admin=False))
        added.append(mid)
    if not added:
        return {"added": 0}
    db.commit()
    g = db.query(Group).filter(Group.id==gid).first()
    ev = {"event": "group_update", "group_id": gid, "name": g.name if g else ""}
    for mid in set(_group_member_ids(gid, db)):
        await manager.send_encrypted_message(ev, mid)
    return {"added": len(added)}

@app.delete("/api/groups/{gid}/members/{target_uid}")
async def remove_group_member(gid: int, target_uid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    return await _remove_group_member(gid, target_uid, db, uid)

@app.post("/api/groups/{gid}/members/remove")
async def remove_group_member_post(gid: int, d: GroupMemberRemoveIn, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    return await _remove_group_member(gid, d.user_id, db, uid)

async def _remove_group_member(gid: int, target_uid: int, db: Session, uid: int):
    target_uid = int(target_uid)
    gid = int(gid)
    if target_uid == uid:
        raise HTTPException(400, "Используйте выход из группы")
    if not db.query(Group).filter(Group.id == gid).first():
        raise HTTPException(404, "Группа не найдена")
    if not _is_group_admin(gid, uid, db):
        raise HTTPException(403, "Только админ может удалять участников")
    gm = db.query(GroupMember).filter(GroupMember.group_id == gid, GroupMember.user_id == target_uid).first()
    if not gm:
        raise HTTPException(404, "Участник не найден в группе")
    db.delete(gm); db.commit()
    g = db.query(Group).filter(Group.id==gid).first()
    ev = {"event": "group_update", "group_id": gid, "name": g.name if g else "", "removed_uid": target_uid}
    await manager.send_encrypted_message(ev, target_uid)
    for mid in _group_member_ids(gid, db):
        await manager.send_encrypted_message(ev, mid)
    return {"status": "removed"}

@app.post("/api/groups/{gid}/leave")
async def leave_group(gid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    gm = db.query(GroupMember).filter_by(group_id=gid, user_id=uid).first()
    if not gm:
        raise HTTPException(404, "Вы не состоите в этой группе")
    was_admin = gm.is_admin
    db.delete(gm); db.commit()
    remaining = db.query(GroupMember).filter(GroupMember.group_id==gid).all()
    g = db.query(Group).filter(Group.id==gid).first()
    gname = g.name if g else ""
    if not remaining:
        if g:
            db.delete(g)
            db.commit()
        await manager.send_encrypted_message({"event": "group_update", "group_id": gid, "left": True}, uid)
        return {"status": "left", "group_deleted": True}
    if was_admin:
        remaining[0].is_admin = True
        db.commit()
    ev = {"event": "group_update", "group_id": gid, "name": gname, "left_uid": uid}
    await manager.send_encrypted_message(ev, uid)
    for mem in remaining:
        await manager.send_encrypted_message(ev, mem.user_id)
    return {"status": "left"}

@app.delete("/api/groups/{gid}/messages")
async def clear_group_messages(gid: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    if not _is_group_admin(gid, uid, db):
        raise HTTPException(403, "Только админ может очистить историю")
    msgs = db.query(Message).filter(Message.group_id==gid, Message.deleted_for_all==False).all()
    if not msgs:
        return {"cleared": 0}
    for m in msgs:
        m.deleted_for_all = True
    db.commit()
    targets = _group_member_ids(gid, db)
    for m in msgs:
        ev = {"event": "deleted", "id": m.id, "group_id": gid, "sender_id": m.sender_id, "recipient_id": None}
        for t in targets:
            await manager.send_encrypted_message(ev, t)
    return {"cleared": len(msgs)}

@app.get("/api/groups/{gid}/shared")
def group_shared_content(gid: int, kind: str = "media", db: Session = Depends(get_db), uid: int = Depends(_uid)):
    if not db.query(GroupMember).filter_by(group_id=gid, user_id=uid).first():
        raise HTTPException(403, "Not a member")
    base_q = db.query(Message).filter(Message.group_id == gid, Message.deleted_for_all == False)
    return _shared_items(base_q, kind)

# ── SHARED MEDIA / FILES (DM) ─────────────────────────────────
@app.get("/api/shared/{other}")
def shared_content(other: int, kind: str = "media", db: Session = Depends(get_db), uid: int = Depends(_uid)):
    """Return shared media/files/voice/links between current user and `other`.
    kind: 'media' (image), 'files' (file), 'voice' (voice), 'links' (URLs in text)."""
    base_q = db.query(Message).filter(
        Message.group_id == None,
        Message.deleted_for_all == False,
        or_(
            and_(Message.sender_id == uid, Message.recipient_id == other),
            and_(Message.sender_id == other, Message.recipient_id == uid),
        ),
    )
    return _shared_items(base_q, kind)

# ── COMMON GROUPS between two users ───────────────────────────
@app.get("/api/common_groups/{other}")
def common_groups(other: int, db: Session = Depends(get_db), uid: int = Depends(_uid)):
    my_gids = {gm.group_id for gm in db.query(GroupMember).filter(GroupMember.user_id == uid).all()}
    other_gids = {gm.group_id for gm in db.query(GroupMember).filter(GroupMember.user_id == other).all()}
    common = my_gids & other_gids
    out = []
    for gid in common:
        g = db.query(Group).filter(Group.id == gid).first()
        if g:
            cnt = db.query(GroupMember).filter(GroupMember.group_id == gid).count()
            out.append({"id": g.id, "name": g.name, "avatar_emoji": g.avatar_emoji or "👥",
                        "avatar_b64": getattr(g, "avatar_b64", None), "member_count": cnt})
    return out

# ── ONLINE STATUS ─────────────────────────────────────────────
@app.get("/api/online")
def online_users(db: Session = Depends(get_db), uid: int = Depends(_uid)):
    online = manager.get_online_users()
    # фильтруем тех, кто скрыл статус
    result = {}
    for oid in online:
        u = db.query(User).filter(User.id==oid).first()
        if u and not u.hide_online:
            result[oid] = True
        elif u and u.id == uid:
            result[oid] = True  # себя всегда показываем себе
    return result

# ── WEBSOCKET ─────────────────────────────────────────────────
@app.websocket("/ws/{token}")
async def ws(websocket: WebSocket, token: str):
    """Instant delivery. A FRESH DB session is opened per incoming message so
    that writes from other connections are always visible immediately (the old
    code reused one long-lived session for the whole socket, which under SQLite
    WAL could serve stale snapshots and delayed delivery)."""
    p = verify_token(token)
    if not p:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION); return
    uid = p["user_id"]
    await manager.connect(uid, websocket)
    db = SessionLocal()
    try:
        await _broadcast_presence(uid, True, db, websocket)
    finally:
        db.close()
    try:
        while True:
            raw = await websocket.receive_text()
            try: msg = json.loads(raw)
            except Exception: continue
            # heartbeat ping/pong — keeps the socket alive, no message stored
            if msg.get("ping"):
                try: await websocket.send_text(json.dumps({"event": "pong"}))
                except Exception: pass
                continue
            if msg.get("ping"):
                try: await websocket.send_text(json.dumps({"event": "pong"}))
                except Exception: pass
                continue
            try:
                await _persist_message(uid, msg)
            except HTTPException:
                continue
            except Exception as e:
                logger.error("WS persist uid=%s: %s", uid, e)
    except WebSocketDisconnect:
        await manager.disconnect(uid, websocket)
        db = SessionLocal()
        try:
            await _broadcast_presence(uid, False, db)
        finally:
            db.close()
    except Exception as e:
        logger.error("WS %s: %s", uid, e)
        await manager.disconnect(uid, websocket)
        db = SessionLocal()
        try:
            await _broadcast_presence(uid, False, db)
        finally:
            db.close()
