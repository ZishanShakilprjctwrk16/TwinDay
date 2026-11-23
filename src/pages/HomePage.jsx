import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getUser } from "../utils/storage";

export default function HomePage() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [role, setRole] = useState("");
  useEffect(() => { setUser(getUser() || {}); setRole(localStorage.getItem("role") || ""); }, []);
  const isBengali = i18n.language === "bn";
  return <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-100 to-green-300 text-center p-6"><h1 className="text-3xl font-bold text-green-700 mb-4">{isBengali ? `স্বাগতম, ${user.name || "ব্যবহারকারী"}` : `Welcome, ${user.name || "User"}`}</h1><p className="text-lg mb-6">{isBengali ? `আপনার নির্বাচিত ভূমিকা: ${t(role)}` : `Your selected role: ${role}`}</p><div className="flex gap-3"><button onClick={() => navigate(role === "specialCare" ? "/special-care" : "/routine")} className="bg-green-600 text-white px-4 py-2 rounded-md">Go to Dashboard</button><button onClick={() => navigate("/account")} className="bg-slate-700 text-white px-4 py-2 rounded-md">Account</button><LogoutButton /></div></div>;
}
