import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: { welcome: "Welcome to Twin Day", register: "Register", login: "Login", selectRole: "Select Your Role", student: "Student", employee: "Office Employee", business: "Business", specialCare: "Special Care", next: "Next", back: "Back", name: "Name", email: "Email", phone: "Phone", password: "Password", createAccount: "Create an account", alreadyRegistered: "Already registered? Login", loggingIn: "Logging in...", creatingAccount: "Creating account..." } },
  bn: { translation: { welcome: "টুইন ডে-তে স্বাগতম", register: "নিবন্ধন করুন", login: "লগ ইন করুন", selectRole: "আপনার ভূমিকা নির্বাচন করুন", student: "ছাত্র", employee: "কর্মচারী", business: "ব্যবসায়ী", specialCare: "বিশেষ যত্ন", next: "পরবর্তী", back: "ফিরে যান", name: "নাম", email: "ইমেইল", phone: "ফোন", password: "পাসওয়ার্ড", createAccount: "অ্যাকাউন্ট তৈরি করুন", alreadyRegistered: "আগে নিবন্ধিত? লগ ইন করুন", loggingIn: "লগ ইন হচ্ছে...", creatingAccount: "অ্যাকাউন্ট তৈরি হচ্ছে..." } },
};

i18n.use(initReactI18next).init({ resources, lng: "en", fallbackLng: "en", interpolation: { escapeValue: false } });

export default i18n;
