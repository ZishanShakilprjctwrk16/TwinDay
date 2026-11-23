import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
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
