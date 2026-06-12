import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

# DB путь можно переопределить через env; по умолчанию — рядом с backend/
_db_path = os.environ.get("DATABASE_URL", "sqlite:///./messenger.db")

engine = create_engine(
    _db_path,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA foreign_keys=ON")   # включаем FK — в оригинале было отключено
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# declarative_base из sqlalchemy.ext.declarative deprecated с SQLAlchemy 2.0
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
