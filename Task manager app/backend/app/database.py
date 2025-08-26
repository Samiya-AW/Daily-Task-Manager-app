from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

# Save DB file in the 'data/' directory (ensure it exists)
db_path = Path(__file__).parent.parent / "data" / "database.db"
sqlite_url = f"sqlite:///{db_path}"

# Ensure data folder exists
db_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
