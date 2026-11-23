import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const nextLanguage = i18n.language === "en" ? "bn" : "en";
  return <button type="button" onClick={() => i18n.changeLanguage(nextLanguage)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{i18n.language === "en" ? "বাংলা" : "English"}</button>;
}
