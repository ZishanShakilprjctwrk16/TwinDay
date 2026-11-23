import { useCallback, useEffect, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Bell, Mic, StopCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LogoutButton from "../components/LogoutButton";
import { getToken } from "../utils/storage";

const endpoint = "http://127.0.0.1/twinday-api/api/reminders.php";

export default function SpecialCareDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState("");
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const loadReminders = useCallback(async () => {
    const response = await fetch(endpoint, { headers: { "X-Auth-Token": getToken() } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load reminders.");
    setReminders(result.reminders);
  }, []);

  useEffect(() => { loadReminders().catch((loadError) => setError(loadError.message)); }, [loadReminders]);

  const addReminder = useCallback(async (text) => {
    const remindAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ text, remind_at: remindAt }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to save reminder.");
    await loadReminders();
  }, [loadReminders]);

  useEffect(() => {
    const command = transcript.toLowerCase();
    if (command.includes("medicine") || command.includes("ওষুধ")) { addReminder(i18n.language === "bn" ? "ওষুধ খাওয়ার সময়" : "Medicine time").catch((addError) => setError(addError.message)); resetTranscript(); }
    if (command.includes("exercise") || command.includes("ব্যায়াম")) { addReminder(i18n.language === "bn" ? "ব্যায়ামের সময়" : "Exercise time").catch((addError) => setError(addError.message)); resetTranscript(); }
    if (command.includes("write routine")) { navigate("/routine"); resetTranscript(); }
  }, [addReminder, i18n.language, navigate, resetTranscript, transcript]);

  const toggleListening = () => {
    if (isListening) { SpeechRecognition.stopListening(); setIsListening(false); return; }
    SpeechRecognition.startListening({ continuous: true, language: i18n.language === "bn" ? "bn-BD" : "en-US" });
    setIsListening(true);
  };

  const dismiss = async (id) => {
    await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ id, status: "dismissed" }) });
    await loadReminders();
  };

  return <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 p-6"><div className="max-w-3xl mx-auto"><div className="flex flex-wrap justify-between gap-3 items-center mb-5"><h1 className="text-3xl font-bold text-indigo-800">{i18n.language === "bn" ? "বিশেষ যত্ন সহকারী" : "Special Care Assistant"}</h1><div className="flex gap-2"><button onClick={() => navigate("/account")} className="bg-slate-700 text-white px-3 py-2 rounded">Account</button><LogoutButton /></div></div><p className="text-lg text-gray-700 mb-6">{i18n.language === "bn" ? "‘Write Routine’, ‘Medicine’ বা ‘Exercise’ বলুন।" : "Say 'Write Routine', 'Medicine', or 'Exercise' to create help reminders."}</p>{error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}{browserSupportsSpeechRecognition ? <button onClick={toggleListening} className={`flex items-center px-6 py-3 rounded-full shadow text-white font-semibold ${isListening ? "bg-red-500" : "bg-green-600"}`}>{isListening ? <StopCircle size={24} className="mr-2" /> : <Mic size={24} className="mr-2" />}{isListening ? "Stop Listening" : "Start Listening"}</button> : <p className="bg-yellow-100 text-yellow-800 p-3 rounded">Speech recognition is not supported in this browser.</p>}<div className="mt-6 bg-white rounded-lg shadow p-4"><h2 className="text-xl font-semibold mb-2 text-indigo-700">Heard command</h2><p className="text-gray-600">{transcript || "Waiting for command..."}</p></div><div className="mt-8 bg-white rounded-lg shadow p-5"><h2 className="text-xl font-semibold mb-3 text-indigo-700 flex items-center"><Bell size={20} className="mr-2" /> Reminders</h2>{reminders.length === 0 ? <p className="text-gray-500">No reminders yet.</p> : reminders.map((reminder) => <div key={reminder.id} className="flex justify-between gap-3 border-b py-3"><div><p className="font-medium">{reminder.text}</p><p className="text-sm text-gray-500">{reminder.remind_at} · {reminder.status}</p></div>{reminder.status === "pending" && <button onClick={() => dismiss(reminder.id).catch((dismissError) => setError(dismissError.message))} className="text-red-700 underline">Dismiss</button>}</div>)}</div></div></div>;
}
