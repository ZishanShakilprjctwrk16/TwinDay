import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getToken } from "../utils/storage";

const endpoint = "http://127.0.0.1/twinday-api/api/admin_users.php";

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", password: "", role: "normal_user" });

  const loadUsers = useCallback(async () => {
    const response = await fetch(endpoint, { headers: { "X-Auth-Token": getToken() } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load users.");
    setUsers(result.users);
  }, []);

  useEffect(() => {
    loadUsers().catch((loadError) => setError(loadError.message));
  }, [loadUsers]);

  const updateUser = async (event) => {
    event.preventDefault();
    setError("");
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
      body: JSON.stringify(editingUser),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to update the user.");
    setEditingUser(null);
    await loadUsers();
  };

  const createUser = async (event) => {
    event.preventDefault();
    setError("");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
      body: JSON.stringify(newUser),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to create the user.");
    setNewUser({ name: "", email: "", phone: "", password: "", role: "normal_user" });
    await loadUsers();
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user and all of their routines, reminders, and messages?")) return;
    setError("");
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
      body: JSON.stringify({ id: userId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to delete the user.");
    await loadUsers();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Super Admin Dashboard</h1>
            <p className="text-slate-600">View and manage registered users and their roles.</p>
          </div>
          <div className="flex gap-2"><button onClick={() => navigate("/messages")} className="bg-indigo-600 text-white px-4 py-2 rounded-md">Messages</button><button onClick={() => navigate("/home")} className="bg-blue-600 text-white px-4 py-2 rounded-md">User Home</button><LogoutButton /></div>
        </div>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={(event) => createUser(event).catch((createError) => setError(createError.message))} className="bg-white rounded-xl shadow p-4 mb-6 grid gap-3 md:grid-cols-6"><h2 className="md:col-span-6 text-xl font-semibold">Add account</h2><input value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} placeholder="Name" className="border rounded px-3 py-2" required /><input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} placeholder="Email" className="border rounded px-3 py-2" required /><input value={newUser.phone} onChange={(event) => setNewUser({ ...newUser, phone: event.target.value })} placeholder="Phone" className="border rounded px-3 py-2" required /><input type="password" minLength={8} value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} placeholder="Password" className="border rounded px-3 py-2" required /><select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })} className="border rounded px-3 py-2"><option value="normal_user">Normal user</option><option value="super_admin">Super admin</option></select><button className="bg-green-600 text-white rounded px-3 py-2">Add account</button></form>
        <div className="bg-white rounded-xl shadow overflow-x-auto"><div className="p-4 flex gap-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or phone" className="border rounded px-3 py-2 flex-1" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border rounded px-3 py-2"><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
          <table className="w-full text-left">
            <thead className="bg-slate-200"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Roles</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
            <tbody>{users.filter((user) => statusFilter === "all" || user.status === statusFilter).filter((user) => `${user.name} ${user.email} ${user.phone || ""}`.toLowerCase().includes(search.toLowerCase())).map((user) => <tr key={user.id} className="border-t">
              <td className="p-3">{user.name}</td><td className="p-3">{user.email}</td><td className="p-3">{user.phone || "—"}</td><td className="p-3">{user.roles.join(", ") || "—"}</td><td className="p-3">{user.status}</td>
              <td className="p-3"><div className="flex gap-2"><button onClick={() => setEditingUser({ id: user.id, name: user.name, email: user.email, phone: user.phone || "", status: user.status, roles: user.roles })} className="text-blue-700 underline">Edit</button><button onClick={() => deleteUser(user.id).catch((deleteError) => setError(deleteError.message))} className="text-red-700 underline">Delete</button></div></td>
            </tr>)}</tbody>
          </table>
        </div>
        {editingUser && <form onSubmit={(event) => updateUser(event).catch((updateError) => setError(updateError.message))} className="mt-6 bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-5">
          <input value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} className="border rounded px-3 py-2" aria-label="Edit name" />
          <input value={editingUser.email} onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })} className="border rounded px-3 py-2" aria-label="Edit email" />
          <input value={editingUser.phone} onChange={(event) => setEditingUser({ ...editingUser, phone: event.target.value })} className="border rounded px-3 py-2" aria-label="Edit phone" />
          <select value={editingUser.status} onChange={(event) => setEditingUser({ ...editingUser, status: event.target.value })} className="border rounded px-3 py-2" aria-label="Edit status"><option value="active">Active</option><option value="suspended">Suspended</option></select>
          <select value={editingUser.roles.includes("super_admin") ? "super_admin" : "normal_user"} onChange={(event) => setEditingUser({ ...editingUser, roles: [event.target.value] })} className="border rounded px-3 py-2" aria-label="Edit role"><option value="normal_user">Normal user</option><option value="super_admin">Super admin</option></select>
          <div className="flex gap-2"><button type="submit" className="bg-blue-600 text-white rounded px-3 py-2">Save</button><button type="button" onClick={() => setEditingUser(null)} className="bg-gray-200 rounded px-3 py-2">Cancel</button></div>
        </form>}
      </div>
    </div>
  );
}
