import { Mic, MicOff } from "lucide-react";
import { useState } from "react";

export default function VoiceAssistant() {
  const [listening, setListening] = useState(false);

  const toggleMic = () => {
    setListening(!listening);
  };

  return (
    <div className="fixed bottom-8 right-8">
      <button
        onClick={toggleMic}
        className={`p-5 rounded-full shadow-lg transition duration-300 ${
          listening ? "bg-red-500" : "bg-indigo-500"
        } hover:scale-110`}
      >
        {listening ? (
          <MicOff className="text-white w-6 h-6" />
        ) : (
          <Mic className="text-white w-6 h-6" />
        )}
      </button>
      <p className="text-gray-700 text-sm mt-2 text-center">
        {listening ? "Listening..." : "Tap to speak"}
      </p>
    </div>
  );
}
