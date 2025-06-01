
#  Daily Task Manager

A modern, interactive **Task Manager Web App** built with **Next.js (React + TypeScript)** frontend and **FastAPI (Python)** backend.  
It helps you stay productive by creating tasks, subtasks, setting deadlines, priorities, and tracking your progress in a clean UI without the need of logging in again and agian.

---

##  Features

- ✅ Add, edit, and delete tasks
- ✅ Mark tasks as completed (Done/Undo toggle)
- ✅ Separate **Pending** and **Completed** tabs
- ✅ Add subtasks with checkbox progress
- ✅ Independent **Due Date** and **Due Time** fields  
- ✅ Motivational quote shown on top
- ✅ Priority levels (High / Medium / Low) with color labels
- ✅ Notifications with toast alerts for actions
- ✅ Sort tasks by **due date** or **priority**
- ✅ Warning for tasks due in the next 24 hours
- ✅ Animations with **Framer Motion**
- ✅ Fully responsive UI

---

##  Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) (React + TypeScript)
- Tailwind CSS
- Framer Motion (animations)
- Toast notifications

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- Uvicorn ASGI server

---

##  Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
````

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will run on: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| GET    | `/tasks`                       | Fetch all tasks          |
| POST   | `/tasks`                       | Create a new task        |
| PUT    | `/tasks/{id}`                  | Update a task            |
| PATCH  | `/tasks/{id}/toggle`           | Toggle completion status |
| DELETE | `/tasks/{id}`                  | Delete a task            |
| PATCH  | `/tasks/{id}/subtasks/{subId}` | Update a subtask status  |
| GET    | `/quote`                       | Get motivational quote   |

---

##  Screenshots

### 🔹 Task List with Priorities

![Task List Screenshot](docs/task-list.png)

### 🔹 Subtasks Checklist

![Subtask Screenshot](docs/subtasks.png)

---

##  Roadmap

* [ ] Collapse/expand subtasks list
* [ ] Bulk actions (e.g., clear completed tasks)
* [ ] Persistent DB (SQLite/PostgreSQL instead of JSON)
* [ ] User authentication (login/logout, personal task list)
* [ ] Deploy backend + frontend to cloud (Render / Vercel / Railway)

---

##  Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you would like to change.

---

##  License

This project is licensed under the MIT License.

---

##  Acknowledgments

* Built with [FastAPI](https://fastapi.tiangolo.com/) & [Next.js](https://nextjs.org/)
* Motivational quotes API integration



