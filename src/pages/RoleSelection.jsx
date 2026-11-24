import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LogoutButton from "../components/LogoutButton";
import { getToken, getUser, writeJson } from "../utils/storage";

const roles = [
  { id: "caregiver", icon: "👥" },
  { id: "student", icon: "🎓" },
  { id: "employee", icon: "💼" },
  { id: "business", icon: "📈" },
  { id: "specialCare", icon: "💖" },
];

export default function RoleSelection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const chooseRole = async (role) => {
    localStorage.setItem("role", role);
    const response = await fetch("http://127.0.0.1/twinday-api/api/account.php", { method: "PATCH", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ preferred_role: role }) });
    const result = await response.json();
    if (!response.ok) { window.alert(result.error || "Unable to save your role."); return; }
    if (result.user) writeJson("user", { ...getUser(), ...result.user });
    navigate(role === "caregiver" ? "/caregiver" : "/home");
  };
  return <div className="min-h-screen flex flex-col justify-center items-center bg-blue-100 p-6"><div className="w-full max-w-xl flex justify-end mb-4"><LogoutButton /></div><h1 className="text-3xl font-bold mb-8 text-blue-700">{t("selectRole")}</h1><div className="grid grid-cols-2 gap-6">{roles.map((role) => <button key={role.id} onClick={() => chooseRole(role.id)} className="bg-white shadow-lg p-6 rounded-xl w-32 h-32 flex flex-col justify-center items-center text-lg font-semibold hover:bg-blue-50 transition"><span className="text-3xl mb-2">{role.icon}</span>{t(role.id, { defaultValue: role.id === "caregiver" ? "Caregiver" : role.id })}</button>)}</div></div>;
}
