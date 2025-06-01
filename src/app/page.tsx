"use client";

import { useEffect, useRef, useState } from "react";
import { showSuccess, showError } from "@/utils/toastHelpers";
import { motion, AnimatePresence } from "framer-motion";

type Subtask = {
  id: number;
  title: string;
  completed: boolean;
};

type Task = {
  id: number;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: string;
  subtasks?: Subtask[]; // ✅ Add subtasks array
};

const priorityColors: Record<string, string> = {
  High: "bg-red-500 text-white",
  Medium: "bg-yellow-400 text-black",
  Low: "bg-green-500 text-white",
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDueTime, setNewDueTime] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [quote, setQuote] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [dismissedTaskIds, setDismissedTaskIds] = useState<number[]>([]);

  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<number, string>>({});

  const toggleSubtask = async (taskId: number, subtaskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    try {
      const res = await fetch(`http://localhost:8000/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !subtask.completed }),
      });

      if (!res.ok) throw new Error(await res.text());

      const updatedSubtask = await res.json();

      // ✅ Update local task state with updated subtask
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks?.map((s) =>
                  s.id === subtaskId ? updatedSubtask : s
                ),
              }
            : t
        )
      );

      showSuccess("Subtask updated");
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      showError("Could not update subtask.");
    }
  };

  const addSubtask = async (taskId: number) => {
    const title = newSubtaskTitles[taskId]?.trim();
    if (!title) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Strip out only title + completed from existing subtasks
    const cleanSubtasks = (task.subtasks ?? []).map((s) => ({
      title: s.title,
      completed: s.completed,
    }));

    const newSubtask = {
      title,
      completed: false,
    };

    const updatedTask = {
      ...task,
      subtasks: [...cleanSubtasks, newSubtask],
   };

    const res = await fetch(`http://localhost:8000/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Update failed:", errText);
      showError(`Failed to update task: ${errText}`);
    }

    setNewSubtaskTitles((prev) => ({ ...prev, [taskId]: "" }));
    fetchTasks();
  };

  const patchSubtask = async (taskId: number, subtaskId: number, data: Partial<Subtask>) => {
    try {
      const res = await fetch(`http://localhost:8000/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchTasks();
    } catch (err) {
      console.error("Failed to patch subtask:", err);
      showError("Could not update subtask.");
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchQuote = async () => {
    try {
      const res = await fetch("http://localhost:8000/quote");
      const data = await res.json();
      setQuote(data.quote);
    } catch {
      setQuote("Stay focused and keep improving.");
    }
  };

  const fetchTasks = async (sortBy = "") => {
  const res = await fetch(`http://localhost:8000/tasks${sortBy ? `?sort_by=${sortBy}` : ""}`, {
    headers: { "Accept": "application/json" },
  });
  const data = await res.json();
  console.log("Fetched tasks:", data); // ✅ Debugging line
  setTasks(data);
};

  const handleSubmit = async () => {
    setFormError("");
    const trimmedTitle = newTask.trim();

    if (!trimmedTitle) {
      setFormError("Task title is required.");
      showError("Task title is required.");
      return;
    }

    const isDuplicate = tasks.some(
      (t) =>
        t.title.trim().toLowerCase() === trimmedTitle.toLowerCase() &&
        t.id !== editingTaskId
    );

    if (isDuplicate) {
      setFormError("Duplicate task title.");
      showError("A task with this title already exists.");
      return;
    }

//     let dueDateTime: string | null = null;
//
//     if (newDueDate) {
//       const isDateOnly = newDueDate.length === 10; // e.g. "2025-07-15"
//       dueDateTime = isDateOnly ? `${newDueDate} ${newDueTime || "00:00"}` : newDueDate;
//     }
    let dueDateTime: string | null = null;

    const prevTask = editingTaskId
      ? tasks.find((t) => t.id === editingTaskId)
      : null;

    const prevDue = prevTask?.dueDate?.split("T") ?? [];
    const prevDate = prevDue[0] || "";
    const prevTime = prevDue[1]?.slice(0, 5) || ""; // Strip seconds

    const hasNewDate = newDueDate.trim() !== "";
    const hasNewTime = newDueTime.trim() !== "";

    if (hasNewDate || hasNewTime) {
      const datePart = hasNewDate ? newDueDate : prevDate;
      const timePart = hasNewTime ? newDueTime : prevTime;

    if (datePart && timePart) {
      dueDateTime = `${datePart}T${timePart}`;
    } else {
      dueDateTime = null;
    }
  } else {
    dueDateTime = prevTask?.dueDate || null;
  }

    const taskObj: Task = {
      id: editingTaskId ?? Date.now(),
      title: trimmedTitle,
      completed: false,
      dueDate: dueDateTime,
      priority: newPriority,
    };

    console.log("📤 Submitting task:", taskObj);

    try {
      const res = await fetch(`http://localhost:8000/tasks/${editingTaskId ?? ""}`, {
        method: editingTaskId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskObj),
      });

      if (res.ok) {
        setNewTask("");
        setNewDueDate("");
        setNewDueTime("");
        setNewPriority("Medium");
        setEditingTaskId(null);
        fetchTasks();
        showSuccess(editingTaskId ? "Task updated!" : "Task added!");
        inputRef.current?.focus();
      } else {
        const errorText = await res.text();
        setFormError(`Failed to submit task. ${errorText}`);
        showError(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error("Error submitting task:", err);
      showError("An unexpected error occurred.");
    }
  };

  const toggleComplete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/tasks/${id}/toggle`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error(await res.text());

      const updatedTask = await res.json();
      console.log("🔁 PATCH result:", updatedTask);

      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, ...updatedTask } : task))
      );

      showSuccess(updatedTask.completed ? "Task completed!" : "Marked as pending!");
    } catch (err) {
      console.error("❌ Failed to toggle task:", err);
      showError("Error toggling task.");
    }
  };

  const deleteTask = async (id: number) => {
    await fetch(`http://localhost:8000/tasks/${id}`, {
      method: "DELETE",
    });
    fetchTasks();
    showSuccess("Task deleted!");
  };

  const handleEdit = (task: Task) => {
    setNewTask(task.title);
    setNewDueDate(task.dueDate?.split(" ")[0] || "");
    setNewDueTime(task.dueDate?.split(" ")[1] || "");
    setNewPriority(task.priority || "Medium");
    setEditingTaskId(task.id);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const getUpcomingDueTasks = () => {
    const now = new Date();
    const threshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return tasks.filter((task) => {
      if (task.completed || !task.dueDate || dismissedTaskIds.includes(task.id)) return false;
      const due = new Date(task.dueDate);
      return due > now && due <= threshold;
    });
  };

  const handleDismiss = (id: number) => {
    setDismissedTaskIds((prev) => [...prev, id]);
  };

  useEffect(() => {
    fetchQuote();
    fetchTasks("dueDate");
    inputRef.current?.focus();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white p-4 sm:p-6 rounded-2xl shadow-lg transition-all">
        <h1 className="text-3xl font-bold text-center mb-4">🧠 Daily Task Manager</h1>
        <p className="italic text-center text-gray-600 mb-6">🌟 {quote}</p>

        {getUpcomingDueTasks().map((task) => (
          <div
            key={task.id}
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 px-4 py-3 mb-3 rounded relative text-sm flex justify-between items-center"
          >
            <span>⏰ Task “{task.title}” is due soon (by {task.dueDate})</span>
            <button
              onClick={() => handleDismiss(task.id)}
              className="ml-4 text-xl leading-none focus:outline-none"
            >
              &times;
            </button>
          </div>
        ))}

        {/* 📝 Task Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Task Title */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className={`peer w-full px-4 pt-5 pb-2 border rounded-xl transition-all ${
                formError ? "border-red-500" : "border-gray-300"
              } placeholder-transparent focus:outline-none focus:border-blue-500`}
              placeholder="Enter a new task..."
              id="taskTitle"
            />
            <label
              htmlFor="taskTitle"
              className="absolute left-4 top-2 text-sm text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
            >
              Task Title
            </label>
          </div>

          {/* Due Date */}
          <div className="relative">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="peer w-full px-4 pt-5 pb-2 border rounded-xl transition placeholder-transparent focus:outline-none focus:border-blue-500"
              placeholder="Due Date"
              id="dueDate"
            />
            <label
              htmlFor="dueDate"
              className="absolute left-4 top-2 text-sm text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
            >
              Due Date
            </label>
          </div>

          {/* Due Time */}
          <div className="relative">
            <input
              type="time"
              value={newDueTime}
              onChange={(e) => setNewDueTime(e.target.value)}
              className="peer w-full px-4 pt-5 pb-2 border rounded-xl transition placeholder-transparent focus:outline-none focus:border-blue-500"
              placeholder="Due Time"
              id="dueTime"
            />
            <label
              htmlFor="dueTime"
              className="absolute left-4 top-2 text-sm text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
            >
              Due Time
            </label>
          </div>

          {/* Priority */}
          <div className="relative">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="peer w-full px-4 pt-5 pb-2 border rounded-xl transition focus:outline-none focus:border-blue-500 z-10 bg-white"
              id="priority"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <label
              htmlFor="priority"
              className="absolute left-4 top-2 text-sm text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400"
            >
              Priority
            </label>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full px-4 py-2 mb-4 rounded-xl transition-colors duration-200 ${
            editingTaskId ? "bg-purple-500" : "bg-blue-500"
          } text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          {editingTaskId ? "Update Task" : "Add Task"}
        </button>

        {/* Filter + Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "completed", "pending"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as "all" | "completed" | "pending")}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  filter === f ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-800"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            onChange={(e) => fetchTasks(e.target.value)}
            className="px-3 py-2 border rounded-xl transition"
          >
            <option value="">Sort by</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>

        {/* Priority Legend */}
        <div className="text-sm font-semibold text-gray-700 mb-1 text-center">Priority</div>
        <div className="flex justify-center gap-4 mb-4 text-sm">
          {Object.entries(priorityColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full inline-block ${color.split(" ")[0]}`}></span>
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          filter === "all" ? (
            <div className="text-center text-gray-500 italic mt-6">
              📭 No tasks yet. Add your first one!
            </div>
          ) : (
            <div className="text-center text-gray-500 italic mt-6">
              No {filter} tasks found.
            </div>
          )
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col sm:flex-row sm:justify-between items-start sm:items-center px-4 py-2 rounded-xl transition-all ${
                    task.completed
                      ? "bg-green-100 line-through text-gray-500"
                      : "bg-gray-200"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{task.title}</span>
                    {task.dueDate && (
                      <div className="text-sm text-gray-700">
                        📅 Due: {task.dueDate.split("T")[0]}{" "}
                        ⏰ {task.dueDate.split("T")[1]?.slice(0, 5)}
                      </div>
                    )}

                    {/* Debug: Show raw subtasks JSON */}
                    <pre className="text-xs text-gray-500">{JSON.stringify(task.subtasks, null, 2)}</pre>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Priority:</span>
                      <span
                        className={`text-sm px-2 py-1 rounded-full font-semibold inline-block ${
                          priorityColors[task.priority ?? "Medium"]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {/* ✅ Subtasks checklist rendering */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => toggleSubtask(task.id, sub.id)}
                              className="accent-blue-500"
                            />
                            <span className={sub.completed ? "line-through text-gray-500" : ""}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center mt-2 gap-2">
                    <input
                      type="text"
                      value={newSubtaskTitles[task.id] || ""}
                      onChange={(e) =>
                        setNewSubtaskTitles((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                    className="flex-grow px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    placeholder="Add subtask..."
                  />
                  <button
                    onClick={() => addSubtask(task.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    ➕
                  </button>
                </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => toggleComplete(task.id, task.completed)}
                      className={`px-3 py-1 rounded-xl text-sm transition ${
                        task.completed
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {task.completed ? "Undo" : "Done"}
                    </button>
                    <button
                      onClick={() => handleEdit(task)}
                      className="bg-purple-500 text-white px-3 py-1 rounded-xl text-sm transition hover:opacity-90"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm transition hover:opacity-90"
                    >
                      Delete
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </main>
  );
}
