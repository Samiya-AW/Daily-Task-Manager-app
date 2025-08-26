from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import tasks, quotes
from app.routes.tasks import router
from app.database import create_db_and_tables

app = FastAPI()

# Run this on startup to initialize DB and create tables
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Allow frontend (localhost:3000) to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Task Manager API!"}

app.include_router(router, prefix="")
app.include_router(tasks.router)
app.include_router(quotes.router)
