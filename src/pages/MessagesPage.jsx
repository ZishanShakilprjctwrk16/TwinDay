import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getToken } from "../utils/storage";

const endpoint = "http://127.0.0.1/twinday-api/api/messages.php";

export default function MessagesPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ recipient_id: "", subject: "", body: "" });
  const [error, setError] = useState("");
  const loadMessages = useCallback(async () => { const response = await fetch(endpoint, { headers: { "X-Auth-Token": getToken() } }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to load messages."); setMessages(result.messages); setContacts(result.contacts); }, []);
  useEffect(() => { loadMessages().catch((loadError) => setError(loadError.message)); }, [loadMessages]);
  const sendMessage = async (event) => { event.preventDefault(); setError(""); const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify(form) }); const result = await response.json(); if (!response.ok) { setError(result.error || "Unable to send message."); return; } setForm({ recipient_id: "", subject: "", body: "" }); await loadMessages(); };
  return <div className="min-h-screen bg-indigo-50 p-6"><div className="max-w-5xl mx-auto"><div className="flex justify-between items-center mb-6"><div><h1 className="text-3xl font-bold text-indigo-900">Messages</h1><p className="text-indigo-800">Communicate with the TwinDay support team.</p></div><div className="flex gap-2"><button onClick={() => navigate("/routine")} className="bg-green-600 text-white px-4 py-2 rounded-md">Routine Planner</button><LogoutButton /></div></div>{error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}<form onSubmit={sendMessage} className="bg-white rounded-xl shadow p-5 grid gap-3 mb-6"><h2 className="text-xl font-semibold">Send message</h2><select value={form.recipient_id} onChange={(e) => setForm({ ...form, recipient_id: e.target.value })} className="border rounded px-3 py-2" required><option value="">Choose recipient</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} ({contact.email})</option>)}</select><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="border rounded px-3 py-2" /><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your message" className="border rounded px-3 py-2" rows="4" required /><button className="bg-indigo-600 text-white rounded px-4 py-2 w-fit">Send message</button></form><section className="bg-white rounded-xl shadow p-5"><h2 className="text-xl font-semibold mb-3">Conversation history</h2>{messages.length === 0 ? <p className="text-gray-500">No messages yet.</p> : messages.map((message) => <article key={message.id} className="border-b py-3"><p className="font-medium">{message.subject || "No subject"}</p><p className="text-gray-700">{message.body}</p><p className="text-sm text-gray-500">{message.sender_name} → {message.recipient_name} · {message.created_at}</p></article>)}</section></div></div>;
}
