from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import Optional, List
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from app.models import Task, TaskCreate, TaskUpdate, Subtask, SubtaskCreate, SubtaskUpdate, SubtaskRead, TaskRead
from app.database import get_session

router = APIRouter()

@router.get("/tasks", response_model=List[TaskRead])
def get_tasks(
    sort_by: Optional[str] = Query(None, enum=["priority", "dueDate"]),
    only_with_incomplete_subtasks: bool = False,
    session: Session = Depends(get_session)
):
    query = select(Task).options(joinedload(Task.subtasks))
    tasks = session.exec(query).unique().all()

    if only_with_incomplete_subtasks:
        tasks = [task for task in tasks if any(not st.completed for st in task.subtasks or [])]

    if sort_by == "priority":
        priority_order = {"High": 0, "Medium": 1, "Low": 2}
        tasks.sort(key=lambda task: priority_order.get(task.priority, 1))
    elif sort_by == "dueDate":
        tasks.sort(key=lambda task: task.dueDate or "")

    # Convert each SQLModel Task to a Pydantic TaskRead
    return [TaskRead.from_orm(task) for task in tasks]


@router.post("/tasks", response_model=Task)
def add_task(task_data: TaskCreate, session: Session = Depends(get_session)):
    task = Task(
        title=task_data.title,
        dueDate=task_data.dueDate,
        priority=task_data.priority,
        completed=False,
    )

    # Add subtasks if any
    if task_data.subtasks:
        for sub_data in task_data.subtasks:
            subtask = Subtask(
                title=sub_data.title,
                completed=sub_data.completed,
            )
            task.subtasks.append(subtask)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.put("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, updated_data: TaskUpdate, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_dict = updated_data.dict(exclude_unset=True, exclude={"subtasks"})
    for key, value in update_dict.items():
        setattr(task, key, value)

    # Handle subtasks
    if updated_data.subtasks is not None:
        task.subtasks.clear()
        session.flush()
        for sub_data in updated_data.subtasks:
            subtask = Subtask(
                title=sub_data.title,
                completed=sub_data.completed or False,
                task_id=task.id
            )
            task.subtasks.append(subtask)

    session.add(task)
    session.commit()

    # Refetch with joined subtasks
    task = session.exec(
        select(Task)
        .where(Task.id == task_id)
        .options(joinedload(Task.subtasks))
    ).unique().one()

    return TaskRead.from_orm(task)

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()
    return {"message": "Task deleted successfully!"}

@router.delete("/tasks/{task_id}/subtasks/{subtask_id}")
def delete_subtask(
    task_id: int,
    subtask_id: int,
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtask = session.get(Subtask, subtask_id)
    if not subtask or subtask.task_id != task_id:
        raise HTTPException(status_code=404, detail="Subtask not found for this task")

    session.delete(subtask)
    session.commit()
    return {"message": "Subtask deleted successfully"}

@router.patch("/tasks/{task_id}/subtasks/{subtask_id}/toggle", response_model=Subtask)
def toggle_subtask_completion(
    task_id: int,
    subtask_id: int,
    session: Session = Depends(get_session)
):
    subtask = session.get(Subtask, subtask_id)
    if not subtask or subtask.task_id != task_id:
        raise HTTPException(status_code=404, detail="Subtask not found for this task")

    subtask.completed = not subtask.completed
    session.add(subtask)
    session.commit()
    session.refresh(subtask)
    return subtask

@router.patch("/tasks/{task_id}/subtasks/reorder")
def reorder_subtasks(
    task_id: int,
    new_order: List[int],  # List of subtask IDs in desired order
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtasks = session.exec(select(Subtask).where(Subtask.task_id == task_id)).all()

    id_to_subtask = {s.id: s for s in subtasks}
    for idx, subtask_id in enumerate(new_order):
        subtask = id_to_subtask.get(subtask_id)
        if subtask:
            subtask.position = idx
            session.add(subtask)

    session.commit()
    return {"message": "Subtasks reordered successfully"}

@router.patch("/tasks/{task_id}/subtasks/{subtask_id}", response_model=SubtaskRead)
def patch_subtask(
    task_id: int,
    subtask_id: int,
    subtask_update: SubtaskUpdate,
    session: Session = Depends(get_session)
):
    subtask = session.get(Subtask, subtask_id)
    if not subtask or subtask.task_id != task_id:
        raise HTTPException(status_code=404, detail="Subtask not found for this task")

    update_data = subtask_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(subtask, key, value)

    session.add(subtask)
    session.commit()
    session.refresh(subtask)
    return subtask

@router.patch("/tasks/{task_id}/toggle", response_model=TaskRead)
def toggle_task_completion(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = not task.completed
    session.add(task)
    session.commit()
    session.refresh(task)
    return TaskRead.from_orm(task)
