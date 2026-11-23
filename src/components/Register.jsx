import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";
import { writeSession } from "../utils/storage";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1/twinday-api/api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create the account.");
      }

      writeSession(result.user, result.token);
      navigate("/roles");
    } catch (submitError) {
      setError(submitError.message || "Unable to connect to the database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white p-8 rounded-2xl shadow-md w-80 text-center">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">{t("register")}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={t("name")}
            className="border rounded-md px-3 py-2"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder={t("email")}
            className="border rounded-md px-3 py-2"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder={t("phone")}
            className="border rounded-md px-3 py-2"
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder={t("password")}
            className="border rounded-md px-3 py-2"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? t("creatingAccount") : t("next")}
          </button>
        </form>
        <div className="mt-4">
          <LanguageToggle />
        </div>
        <button type="button" onClick={() => navigate("/login")} className="mt-3 text-blue-700 underline">
          {t("alreadyRegistered")}
        </button>
      </div>
    </div>
  );
}
