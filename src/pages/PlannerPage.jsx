import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getToken } from "../utils/storage";
import ReminderWatcher from "../components/ReminderWatcher";

const routineEndpoint = "http://127.0.0.1/twinday-api/api/routines.php";
const reminderEndpoint = "http://127.0.0.1/twinday-api/api/reminders.php";
const headers = () => ({ "Content-Type": "application/json", "X-Auth-Token": getToken() });

export default function PlannerPage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState({ name: "Daily routine", content: "", taskTitle: "", dueTime: "", recurrence: "daily", remindAt: "" });
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [routineResponse, reminderResponse] = await Promise.all([fetch(routineEndpoint, { headers: headers() }), fetch(reminderEndpoint, { headers: headers() })]);
    const routineResult = await routineResponse.json();
    const reminderResult = await reminderResponse.json();
    if (!routineResponse.ok) throw new Error(routineResult.error || "Unable to load routines.");
    if (!reminderResponse.ok) throw new Error(reminderResult.error || "Unable to load reminders.");
    setRoutines(routineResult.routines);
    setReminders(reminderResult.reminders);
  }, []);

  useEffect(() => { loadData().catch((loadError) => setError(loadError.message)); }, [loadData]);

  const saveRoutine = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const routineResponse = await fetch(routineEndpoint, { method: "POST", headers: headers(), body: JSON.stringify({ name: form.name, content: form.content, tasks: form.taskTitle ? [{ title: form.taskTitle, due_time: form.dueTime, recurrence_rule: form.recurrence }] : [] }) });
      const routineResult = await routineResponse.json();
      if (!routineResponse.ok) throw new Error(routineResult.error || "Unable to save routine.");
      if (form.remindAt && form.taskTitle && routineResult.task_ids?.[0]) {
        const reminderResponse = await fetch(reminderEndpoint, { method: "POST", headers: headers(), body: JSON.stringify({ routine_task_id: routineResult.task_ids[0], text: form.taskTitle, remind_at: form.remindAt.replace("T", " ") }) });
        const reminderResult = await reminderResponse.json();
        if (!reminderResponse.ok) throw new Error(reminderResult.error || "Routine saved, but reminder creation failed.");
      }
      setForm({ name: "Daily routine", content: "", taskTitle: "", dueTime: "", recurrence: "daily", remindAt: "" });
      await loadData();
    } catch (saveError) { setError(saveError.message); }
  };

  const dismissReminder = async (id) => {
    await fetch(reminderEndpoint, { method: "PATCH", headers: headers(), body: JSON.stringify({ id, status: "dismissed" }) });
    await loadData();
  };

  return <div className="min-h-screen bg-green-50 p-6"><ReminderWatcher /><div className="max-w-5xl mx-auto">
    <div className="flex justify-between items-center mb-6"><div><h1 className="text-3xl font-bold text-green-900">Routine Planner</h1><p className="text-green-800">Create tasks and schedule reminders from your routine.</p></div><div className="flex gap-2"><button onClick={() => navigate("/messages")} className="bg-indigo-600 text-white px-4 py-2 rounded-md">Messages</button><LogoutButton /></div></div>
    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
    <form onSubmit={saveRoutine} className="bg-white rounded-xl shadow p-5 grid gap-3"><h2 className="text-xl font-semibold">Add routine</h2><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Routine name" className="border rounded px-3 py-2" required /><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe your routine" className="border rounded px-3 py-2" required /><div className="grid md:grid-cols-4 gap-3"><input value={form.taskTitle} onChange={(e) => setForm({ ...form, taskTitle: e.target.value })} placeholder="Task title" className="border rounded px-3 py-2" /><input type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} className="border rounded px-3 py-2" /><select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })} className="border rounded px-3 py-2"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="once">Once</option></select><input type="datetime-local" value={form.remindAt} onChange={(e) => setForm({ ...form, remindAt: e.target.value })} className="border rounded px-3 py-2" /></div><button className="bg-green-600 text-white rounded px-4 py-2 w-fit">Save routine</button></form>
    <div className="grid md:grid-cols-2 gap-5 mt-6"><section className="bg-white rounded-xl shadow p-5"><h2 className="text-xl font-semibold mb-3">Your routines</h2>{routines.length === 0 ? <p className="text-gray-500">No routines yet.</p> : routines.map((routine) => <article key={routine.id} className="border-b py-3"><h3 className="font-semibold">{routine.name}</h3><p className="text-gray-600">{routine.content}</p>{routine.tasks.map((task) => <p key={task.id} className="text-sm text-green-800">• {task.title} {task.due_time ? `at ${task.due_time}` : ""} ({task.recurrence_rule || "once"})</p>)}</article>)}</section><section className="bg-white rounded-xl shadow p-5"><h2 className="text-xl font-semibold mb-3">Reminders</h2>{reminders.length === 0 ? <p className="text-gray-500">No reminders yet.</p> : reminders.map((reminder) => <article key={reminder.id} className="border-b py-3 flex justify-between gap-3"><div><p className="font-medium">{reminder.text}</p><p className="text-sm text-gray-600">{reminder.remind_at} · {reminder.status}</p></div>{reminder.status === "pending" && <button onClick={() => dismissReminder(reminder.id)} className="text-sm text-red-700 underline">Dismiss</button>}</article>)}</section></div>
  </div></div>;
}
