import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState({});
  const [role, setRole] = useState("");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const savedRole = localStorage.getItem("role");
    setUser(savedUser);
    setRole(savedRole);
  }, []);

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-100 to-green-300 text-center">
      <h1 className="text-3xl font-bold text-green-700 mb-4">
        {i18n.language === "en"
          ? `Welcome, ${user?.name || "User"}`
          : `স্বাগতম, ${user?.name || "ব্যবহারকারী"}`}
      </h1>
      <p className="text-lg mb-6">
        {i18n.language === "en"
          ? `Your selected role: ${role}`
          : `আপনার নির্বাচিত ভূমিকা: ${t(role)}`}
      </p>
      <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
        Go to Dashboard
      </button>
    </div>
  );
}
