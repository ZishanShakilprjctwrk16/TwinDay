import { useEffect, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Mic, StopCircle, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SpecialCareDashboard() {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [reminders, setReminders] = useState([]);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const navigate = useNavigate();

  // 🧠 Start or Stop Voice Assistant
  const toggleListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      SpeechRecognition.startListening({ continuous: true, language: i18n.language === "bn" ? "bn-BD" : "en-US" });
      setIsListening(true);
    }
  };

  // 💬 Voice Command Logic
  useEffect(() => {
    const cmd = transcript.toLowerCase();

    if (cmd.includes("medicine")) {
      addReminder(i18n.language === "bn" ? "ওষুধ খাওয়ার সময় 💊" : "Medicine Time 💊");
      resetTranscript();
    } else if (cmd.includes("exercise")) {
      addReminder(i18n.language === "bn" ? "ব্যায়ামের সময় 🏃‍♂️" : "Exercise Time 🏃‍♂️");
      resetTranscript();
    } else if (cmd.includes("write routine")) {
      navigate("/routine");
      resetTranscript();
    }
  }, [transcript]);

  const addReminder = (text) => {
    setReminders((prev) => [...prev, text]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-indigo-800">
        {i18n.language === "bn" ? "বিশেষ যত্ন সহকারী" : "Special Care Assistant"}
      </h1>

      <p className="text-lg text-gray-700 mb-6 text-center max-w-2xl">
        {i18n.language === "bn"
          ? "বলুন 'Write Routine' বা 'Medicine' নির্দেশ দিতে।"
          : "Say 'Write Routine' or 'Medicine' to give voice commands."}
      </p>

      {/* 🎙️ Voice Control Button */}
      <button
        onClick={toggleListening}
        className={`flex items-center px-6 py-3 rounded-full shadow-lg text-white font-semibold transition ${
          isListening ? "bg-red-500" : "bg-green-600"
        } hover:scale-105`}
      >
        {isListening ? <StopCircle size={24} className="mr-2" /> : <Mic size={24} className="mr-2" />}
        {isListening
          ? i18n.language === "bn"
            ? "শোনা বন্ধ করুন"
            : "Stop Listening"
          : i18n.language === "bn"
          ? "শুরু করুন"
          : "Start Listening"}
      </button>

      {/* 🧾 Transcript */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-4 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-2 text-indigo-700">
          {i18n.language === "bn" ? "শোনা কমান্ড:" : "Heard Command:"}
        </h2>
        <p className="text-gray-600">{transcript || (i18n.language === "bn" ? "এখনও কিছু বলা হয়নি..." : "Waiting for command...")}</p>
      </div>

      {/* ⏰ Reminders */}
      <div className="mt-8 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-2 text-indigo-700 flex items-center">
          <Bell size={20} className="mr-2 text-indigo-600" />
          {i18n.language === "bn" ? "রিমাইন্ডার" : "Reminders"}
        </h2>
        <ul className="space-y-2">
          {reminders.map((r, i) => (
            <li key={i} className="bg-white shadow rounded-md px-4 py-2 text-gray-700">
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
