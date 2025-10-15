import { useState } from "react";

export default function RoutineForm() {
  const [task, setTask] = useState("");
  const [routines, setRoutines] = useState([]);

  const addRoutine = () => {
    if (!task.trim()) return;
    setRoutines([...routines, task]);
    setTask("");
  };

  return (
    <div className="mt-24 max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Create Your Daily Routine
      </h2>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Write your routine..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={addRoutine}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition"
        >
          Add
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {routines.map((r, i) => (
          <li
            key={i}
            className="bg-gray-100 px-4 py-2 rounded-lg text-gray-700 shadow-sm"
          >
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
