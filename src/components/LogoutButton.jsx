import { useNavigate } from "react-router-dom";
import { clearSession } from "../utils/storage";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
    >
      Logout
    </button>
  );
}
