import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Save, Home } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useNavigate } from "react-router-dom";
import { getUserStorageKey, readJson, writeJson } from "../utils/storage";
import LogoutButton from "../components/LogoutButton";

export default function RoutinePage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState(() => readJson(getUserStorageKey("routine"), ""));
  const [isListening, setIsListening] = useState(false);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setRoutine((prev) => prev + " " + transcript);
    }
  }, [transcript]);

  const startListening = () => {
    resetTranscript();
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true, language: i18n.language === "bn" ? "bn-BD" : "en-US" });
  };

  const stopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
  };

  const saveRoutine = () => {
    writeJson(getUserStorageKey("routine"), routine.trim());
    resetTranscript();
    alert(i18n.language === "bn" ? "রুটিন সংরক্ষিত হয়েছে!" : "Routine saved!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-green-300 flex flex-col items-center p-4">
      <div className="flex justify-between w-full max-w-3xl">
        <button
          onClick={() => navigate("/special-care")}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700"
        >
          <Home size={20} className="mr-2" />
          {i18n.language === "bn" ? "হোমে ফিরে যান" : "Back Home"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={saveRoutine}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-700"
          >
            <Save size={20} className="mr-2" />
            {i18n.language === "bn" ? "সংরক্ষণ করুন" : "Save Routine"}
          </button>
          <LogoutButton />
        </div>
      </div>

      <h1 className="text-3xl font-bold mt-6 text-green-900">
        📝 {i18n.language === "bn" ? "দৈনন্দিন রুটিন লিখুন" : "Write Your Daily Routine"}
      </h1>

      <textarea
        value={routine}
        onChange={(e) => setRoutine(e.target.value)}
        placeholder={i18n.language === "bn" ? "এখানে আপনার রুটিন লিখুন..." : "Write your routine here..."}
        className="w-full max-w-3xl h-60 mt-6 p-4 border rounded-lg shadow-inner focus:ring-2 focus:ring-green-500"
      ></textarea>

      {/* 🎙️ Voice Input */}
      {browserSupportsSpeechRecognition && <button
        onClick={isListening ? stopListening : startListening}
        className={`mt-6 flex items-center justify-center px-6 py-3 rounded-full shadow-lg text-white transition ${
          isListening ? "bg-red-500" : "bg-green-600"
        } hover:scale-105`}
      >
        <Mic size={24} className="mr-2" />
        {isListening
          ? i18n.language === "bn"
            ? "শোনা বন্ধ করুন"
            : "Stop Listening"
          : i18n.language === "bn"
          ? "ভয়েস দিয়ে রুটিন বলুন"
          : "Speak Routine"}
      </button>}

      <p className="mt-4 text-gray-700 text-lg">{transcript}</p>
    </div>
  );
}
