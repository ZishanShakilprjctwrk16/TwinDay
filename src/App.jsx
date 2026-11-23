import "./i18n";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import RoleSelection from "./pages/RoleSelection";
import HomePage from "./pages/HomePage";
import SpecialCareDashboard from "./pages/SpecialCareDashboard";
import RoutinePage from "./pages/RoutinePage";
import Login from "./components/Login";
import AdminPage from "./pages/AdminPage";
import { getToken } from "./utils/storage";
import { getUser } from "./utils/storage";

function ProtectedRoute({ children, specialCareOnly = false, adminOnly = false }) {
  const user = getUser();
  const role = localStorage.getItem("role");
  const roles = user?.roles || [];

  if (!user || !getToken()) return <Navigate to="/" replace />;
  if (adminOnly && !roles.includes("super_admin")) return <Navigate to="/home" replace />;
  if (!adminOnly && !role && !roles.includes("super_admin")) return <Navigate to="/roles" replace />;
  if (specialCareOnly && role !== "specialCare") return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Registration Flow */}
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/roles" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

        {/* Special Care Section */}
        <Route path="/special-care" element={<ProtectedRoute specialCareOnly><SpecialCareDashboard /></ProtectedRoute>} />
        <Route path="/routine" element={<ProtectedRoute><RoutinePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
