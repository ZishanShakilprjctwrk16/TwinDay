import { useEffect, useRef } from "react";
import { getToken } from "../utils/storage";

const endpoint = "http://127.0.0.1/twinday-api/api/reminders.php";

export default function ReminderWatcher() {
  const alerted = useRef(new Set());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    const checkReminders = async () => {
      const response = await fetch(endpoint, { headers: { "X-Auth-Token": getToken() } });
      if (!response.ok) return;
      const { reminders } = await response.json();
      const now = Date.now();
      for (const reminder of reminders) {
        const dueAt = Date.parse(reminder.remind_at.replace(" ", "T"));
        if (reminder.status === "pending" && dueAt <= now && !alerted.current.has(reminder.id)) {
          alerted.current.add(reminder.id);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("TwinDay reminder", { body: reminder.text });
          } else {
            window.alert(`Reminder: ${reminder.text}`);
          }
          await fetch(endpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
            body: JSON.stringify({ id: reminder.id, status: "sent" }),
          });
        }
      }
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
