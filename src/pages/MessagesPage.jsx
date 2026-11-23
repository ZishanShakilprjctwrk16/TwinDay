import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Paperclip, Search, Send, Smile, ArrowLeft, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getToken, getUser } from "../utils/storage";

const endpoint = "http://127.0.0.1/twinday-api/api/messages.php";
const emojis = ["😀", "😂", "😍", "👍", "🙏", "🎉", "❤️", "✅", "😊", "🤝", "🔥", "💡", "📌", "😄", "😢", "😮", "💪", "🎓", "💼", "📅"];

function formatTime(value) { return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value.replace(" ", "T"))); }
function formatSize(bytes) { if (!bytes) return ""; return `${Math.max(1, Math.round(bytes / 1024))} KB`; }

export default function MessagesPage() {
  const navigate = useNavigate();
  const currentUser = getUser() || {};
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    const response = await fetch(endpoint, { headers: { "X-Auth-Token": getToken() } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load messages.");
    setMessages(result.messages);
    setContacts(result.contacts);
    setSelectedId((current) => current || String(result.contacts[0]?.id || ""));
  }, []);

  useEffect(() => { loadMessages().catch((loadError) => setError(loadError.message)); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedId, messages.length]);

  const selectedContact = contacts.find((contact) => String(contact.id) === String(selectedId));
  const conversation = useMemo(() => messages.filter((message) => String(message.sender_id) === String(selectedId) || String(message.recipient_id) === String(selectedId)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [messages, selectedId]);
  const visibleContacts = contacts.filter((contact) => `${contact.name} ${contact.email}`.toLowerCase().includes(search.toLowerCase()));

  const sendMessage = async (event) => {
    event?.preventDefault();
    if (!selectedId || (!body.trim() && !selectedFile) || sending) return;
    setSending(true);
    setError("");
    const payload = new FormData();
    payload.append("recipient_id", selectedId);
    payload.append("subject", subject);
    payload.append("body", body.trim());
    if (selectedFile) payload.append("attachment", selectedFile);
    const response = await fetch(endpoint, { method: "POST", headers: { "X-Auth-Token": getToken() }, body: payload });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Unable to send message."); setSending(false); return; }
    setBody(""); setSubject(""); setSelectedFile(null); setShowEmojis(false); setSending(false); await loadMessages();
  };

  const handleComposerKeyDown = (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(event); } };
  const addEmoji = (emoji) => setBody((current) => `${current}${emoji}`);
  const startReply = (message) => { if (String(message.sender_id) === String(currentUser.id)) return; setSubject(message.subject ? `Re: ${message.subject.replace(/^Re: /, "")}` : "Re: TwinDay message"); setSelectedId(String(message.sender_id)); };

  return <div className="wa-page min-h-screen p-3 sm:p-6"><div className="max-w-6xl mx-auto"><header className="flex flex-wrap justify-between items-center gap-3 mb-4"><div><h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><MessageCircle className="text-emerald-600" /> Messages</h1><p className="text-slate-600">Stay connected with the TwinDay support team.</p></div><div className="flex gap-2"><button onClick={() => navigate("/routine")} className="bg-emerald-600 text-white px-3 py-2 rounded-lg">Planner</button><button onClick={() => navigate("/account")} className="bg-slate-700 text-white px-3 py-2 rounded-lg">Account</button><LogoutButton /></div></header>{error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>}<div className="wa-window grid md:grid-cols-[280px_1fr] h-[calc(100vh-170px)] min-h-[560px] bg-white rounded-2xl overflow-hidden"><aside className={`border-r border-slate-200 ${selectedContact ? "hidden md:flex" : "flex"} flex-col`}><div className="wa-sidebar-header p-4"><h2 className="font-semibold mb-3">Chats</h2><label className="relative block"><Search size={17} className="absolute left-3 top-2.5 text-slate-300" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" className="w-full bg-white/15 text-white placeholder:text-slate-200 rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/60" /></label></div><div className="overflow-y-auto flex-1">{visibleContacts.length === 0 ? <div className="p-5 text-sm text-slate-500">No active chats available.</div> : visibleContacts.map((contact) => <button key={contact.id} onClick={() => setSelectedId(String(contact.id))} className={`w-full text-left flex items-center gap-3 p-4 border-b border-slate-100 hover:bg-emerald-50 ${String(contact.id) === String(selectedId) ? "bg-emerald-50" : ""}`}><span className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">{contact.name.charAt(0).toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-slate-800">{contact.name}</strong><small className="block truncate text-slate-500">{contact.email}</small></span></button>)}</div></aside><main className={`${selectedContact ? "flex" : "hidden md:flex"} flex-col min-w-0 flex-1 wa-chat-bg`}><div className="wa-chat-header flex items-center gap-3 px-4 py-3"><button onClick={() => setSelectedId("")} className="md:hidden text-white"><ArrowLeft /></button>{selectedContact ? <><span className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">{selectedContact.name.charAt(0).toUpperCase()}</span><div><h2 className="font-semibold">{selectedContact.name}</h2><p className="text-xs text-emerald-100">online support chat</p></div></> : <div><h2 className="font-semibold">Select a chat</h2><p className="text-xs text-emerald-100">Choose a contact to start messaging</p></div>}</div><div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">{!selectedContact ? <div className="h-full flex items-center justify-center text-slate-500"><div className="text-center"><MessageCircle size={42} className="mx-auto mb-2 text-emerald-500" /><p>Select a chat to view the conversation.</p></div></div> : conversation.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500"><p className="bg-white/80 rounded-lg px-4 py-2">No messages yet. Say hello!</p></div> : conversation.map((message) => { const mine = String(message.sender_id) === String(currentUser.id); return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${mine ? "wa-bubble-sent rounded-tr-sm" : "wa-bubble-received rounded-tl-sm"}`}>{message.subject && <p className="text-xs font-semibold text-slate-500 mb-1">{message.subject}</p>}<p className="text-sm text-slate-800 whitespace-pre-wrap">{message.body}</p>{message.attachment_url && <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-lg bg-white/70 border border-slate-200 p-2 text-sm text-emerald-800 hover:bg-white"><FileText size={18} /><span className="truncate">{message.attachment_name}<small className="block text-xs text-slate-500">{formatSize(message.attachment_size)}</small></span></a>}<div className="flex items-center justify-end gap-2 mt-1"><span className="text-[11px] text-slate-500">{formatTime(message.created_at)}</span>{mine && <span className="text-[11px] text-sky-600">✓✓</span>}{!mine && <button onClick={() => startReply(message)} className="text-[11px] text-emerald-700 underline">Reply</button>}</div></div></div>; })}<div ref={bottomRef} /></div>{selectedContact && <form onSubmit={sendMessage} className="relative bg-[#f0f2f5] border-t border-slate-300 p-3 flex items-end gap-2"><input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.txt,.zip,image/*" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} /><button type="button" aria-label="Add attachment" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-emerald-600"><Paperclip size={20} /></button><button type="button" aria-label="Add emoji" onClick={() => setShowEmojis((current) => !current)} className="p-2 text-slate-500 hover:text-emerald-600"><Smile size={20} /></button>{showEmojis && <div className="absolute bottom-16 left-12 bg-white rounded-xl shadow-lg border border-slate-200 p-3 grid grid-cols-7 gap-1 z-10">{emojis.map((emoji) => <button type="button" key={emoji} onClick={() => addEmoji(emoji)} className="text-xl hover:bg-emerald-50 rounded p-1">{emoji}</button>)}</div>}<div className="flex-1">{selectedFile && <div className="flex items-center gap-2 mb-1 text-xs text-slate-600"><FileText size={14} /> <span className="truncate">{selectedFile.name}</span><button type="button" aria-label="Remove attachment" onClick={() => setSelectedFile(null)} className="text-red-600"><X size={14} /></button></div>}<textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Type a message" rows="1" className="w-full resize-none rounded-2xl bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-400" /></div><button disabled={(!body.trim() && !selectedFile) || sending} className="rounded-full bg-[#00a884] text-white p-3 disabled:opacity-50" aria-label="Send message"><Send size={18} /></button></form>}</main></div></div></div>;
}
