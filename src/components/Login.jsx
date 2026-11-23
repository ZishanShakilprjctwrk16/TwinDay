import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { writeSession } from "../utils/storage";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1/twinday-api/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to log in.");

      writeSession(result.user, result.token);
      navigate(result.user.roles.includes("super_admin") ? "/admin" : "/roles");
    } catch (submitError) {
      setError(submitError.message || "Unable to connect to the database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-br from-indigo-100 to-indigo-300">
      <div className="bg-white p-8 rounded-2xl shadow-md w-80 text-center">
        <h2 className="text-2xl font-bold mb-4 text-indigo-700">{t("login")}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" placeholder={t("email")} required className="border rounded-md px-3 py-2" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder={t("password")} required className="border rounded-md px-3 py-2" onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white py-2 rounded-md disabled:opacity-60">
            {isSubmitting ? t("loggingIn") : t("login")}
          </button>
        </form>
        <div className="mt-4"><LanguageToggle /></div>
        <button type="button" onClick={() => navigate("/")} className="mt-4 text-indigo-700 underline">{t("createAccount")}</button>
      </div>
    </div>
  );
}
