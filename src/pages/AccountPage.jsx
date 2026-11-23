import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getToken, getUser, writeJson } from "../utils/storage";

const endpoint = "http://127.0.0.1/twinday-api/api/account.php";

export default function AccountPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser() || {};
    setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "", password: "" });
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Unable to update account."); return; }
    writeJson("user", result.user);
    setForm({ ...result.user, password: "" });
    setMessage("Account updated successfully.");
  };

  return <div className="min-h-screen bg-slate-100 p-6"><div className="max-w-2xl mx-auto"><div className="flex justify-between items-center mb-6"><div><h1 className="text-3xl font-bold text-slate-800">Account settings</h1><p className="text-slate-600">Update your contact details or password.</p></div><div className="flex gap-2"><button onClick={() => navigate("/routine")} className="bg-green-600 text-white rounded px-3 py-2">Planner</button><LogoutButton /></div></div><form onSubmit={save} className="bg-white rounded-xl shadow p-6 grid gap-4"><label className="grid gap-1">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="border rounded px-3 py-2" required /></label><label className="grid gap-1">Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="border rounded px-3 py-2" required /></label><label className="grid gap-1">Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="border rounded px-3 py-2" /></label><label className="grid gap-1">New password<input type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="border rounded px-3 py-2" placeholder="Leave blank to keep current password" /></label>{error && <p className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}{message && <p className="bg-green-100 text-green-700 p-3 rounded">{message}</p>}<button className="bg-indigo-600 text-white rounded px-4 py-2 w-fit">Save changes</button></form></div></div>;
}
