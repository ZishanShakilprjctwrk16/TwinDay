import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getToken } from "../utils/storage";

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1/twinday-api/api/admin_users.php", {
      headers: { "X-Auth-Token": getToken() },
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load users.");
        setUsers(result.users);
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Super Admin Dashboard</h1>
            <p className="text-slate-600">View registered users and their roles.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/home")} className="bg-blue-600 text-white px-4 py-2 rounded-md">User Home</button>
            <LogoutButton />
          </div>
        </div>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-200"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Roles</th><th className="p-3">Status</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id} className="border-t"><td className="p-3">{user.name}</td><td className="p-3">{user.email}</td><td className="p-3">{user.phone || "—"}</td><td className="p-3">{user.roles.join(", ") || "—"}</td><td className="p-3">{user.status}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
