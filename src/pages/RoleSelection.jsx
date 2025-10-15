import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const roles = [
  { id: "student", icon: "🎓" },
  { id: "employee", icon: "💼" },
  { id: "business", icon: "📈" },
  { id: "specialCare", icon: "💖" },
];

export default function RoleSelection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSelect = (role) => {
    localStorage.setItem("role", role);
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-blue-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700">{t("selectRole")}</h1>
      <div className="grid grid-cols-2 gap-6">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            className="bg-white shadow-lg p-6 rounded-xl w-32 h-32 flex flex-col justify-center items-center text-lg font-semibold hover:bg-blue-50 transition"
          >
            <span className="text-3xl mb-2">{role.icon}</span>
            {t(role.id)}
          </button>
        ))}
      </div>
    </div>
  );
}
