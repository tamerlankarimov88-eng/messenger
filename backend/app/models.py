import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Index
from .database import Base

def _now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(64), unique=True, index=True, nullable=False)
    display_name    = Column(String(128), nullable=True)
    phone           = Column(String(32), unique=True, nullable=True, index=True)
    birth_date      = Column(String(16), nullable=True)
    hashed_password = Column(String, nullable=False)
    public_key      = Column(Text, nullable=True)
    avatar_emoji    = Column(String(16), nullable=True, default="😊")
    avatar_color    = Column(String(16), nullable=True, default="#2E86DE")
    avatar_b64      = Column(Text, nullable=True)
    theme           = Column(String(16), nullable=True, default="dark")
    ui_scale        = Column(String(16), nullable=True, default="100")
    pinned_chats    = Column(String(512), nullable=True, default="")
    folders         = Column(Text, nullable=True, default="{}")
    # конфиденциальность
    hide_online     = Column(Boolean, default=False)
    hide_phone      = Column(Boolean, default=False)
    last_seen       = Column(DateTime(timezone=True), nullable=True)
    # избранное: JSON-список id сообщений
    favorites       = Column(Text, nullable=True, default="[]")
    # активные сессии: JSON
    sessions        = Column(Text, nullable=True, default="[]")

class Message(Base):
    __tablename__ = "messages"
    id              = Column(Integer, primary_key=True, index=True)
    sender_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    group_id        = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)
    enc_text        = Column(Text, nullable=False)
    msg_type        = Column(String(16), nullable=False, default="text")
    file_name       = Column(String(256), nullable=True)
    reply_to_id     = Column(Integer, nullable=True)
    reply_preview   = Column(String(256), nullable=True)
    reply_from_id   = Column(Integer, nullable=True)
    reply_from_name = Column(String(128), nullable=True)
    forward_from_id   = Column(Integer, nullable=True)
    forward_from_name = Column(String(128), nullable=True)
    reactions       = Column(Text, nullable=True, default="{}")
    pinned          = Column(Boolean, default=False)
    is_read         = Column(Boolean, default=False)
    read_at         = Column(DateTime(timezone=True), nullable=True)
    is_delivered    = Column(Boolean, default=False)
    edited          = Column(Boolean, default=False)
    deleted_for_all = Column(Boolean, default=False)
    hidden_for        = Column(Text, nullable=True, default="[]")  # JSON [uid,…] — скрыто только у этих пользователей
    timestamp       = Column(DateTime(timezone=True), default=_now, index=True)

class MessageRead(Base):
    __tablename__ = "message_reads"
    id         = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at    = Column(DateTime(timezone=True), default=_now)

class Group(Base):
    __tablename__ = "groups"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(128), nullable=False)
    creator_id   = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    avatar_emoji = Column(String(16), nullable=True, default="👥")
    avatar_b64   = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), default=_now)

class GroupMember(Base):
    __tablename__ = "group_members"
    id       = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    user_id  = Column(Integer, ForeignKey("users.id",  ondelete="CASCADE"), nullable=False)
    is_admin = Column(Boolean, default=False)

Index("idx_sr", Message.sender_id, Message.recipient_id)
Index("idx_gm", GroupMember.group_id, GroupMember.user_id, unique=True)
Index("idx_mr", MessageRead.message_id, MessageRead.user_id, unique=True)
