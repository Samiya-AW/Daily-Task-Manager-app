from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column, Integer
from pydantic import BaseModel, constr
from enum import Enum
from datetime import datetime

class Priority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

# --- SQLModel Task Table ---
class Subtask(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    completed: bool = False
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")

    # Relationship back to the parent task
    task: Optional["Task"] = Relationship(back_populates="subtasks")

# --- New SQLModel SubTask Table ---
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    completed: bool = False
    dueDate: Optional[datetime] = None
    priority: Optional[str] = "Medium"

    # List of subtasks
    subtasks: List[Subtask] = Relationship(back_populates="task", sa_relationship_kwargs={"cascade": "all, delete"})

# --- Pydantic models ---
class SubtaskCreate(BaseModel):
    id: Optional[int] = None
    title: str
    completed: bool = False

class SubtaskUpdate(SQLModel):
    id: Optional[int] = None
    title: Optional[str] = None
    completed: Optional[bool] = None

    class Config:
        from_attributes = True

class SubtaskRead(SQLModel):
    id: int
    title: str
    completed: bool

    class Config:
        from_attributes = True

# Pydantic model for creating a task
class TaskCreate(BaseModel):
    title: constr(min_length=1, strip_whitespace=True)
    dueDate: Optional[datetime] = None
    priority: Priority = Priority.MEDIUM
    subtasks: Optional[List[SubtaskCreate]] = []

# Pydantic model for updating a task
class TaskUpdate(SQLModel):
    title: Optional[str] = None
    dueDate: Optional[datetime] = None
    priority: Optional[Priority] = None
    completed: Optional[bool] = None
    subtasks: Optional[List[SubtaskUpdate]] = None

    class Config:
        from_attributes = True

class TaskRead(SQLModel):
    id: int
    title: str
    priority: str
    completed: bool
    dueDate: Optional[datetime]
    subtasks: List[SubtaskRead] = []

    class Config:
        from_attributes = True

Subtask.update_forward_refs()

if TYPE_CHECKING:
    from .models import Task