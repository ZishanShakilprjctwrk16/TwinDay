import "./i18n";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import RoleSelection from "./pages/RoleSelection";
import HomePage from "./pages/HomePage";
import SpecialCareDashboard from "./pages/SpecialCareDashboard";
import RoutinePage from "./pages/RoutinePage";
import { getUser } from "./utils/storage";

function ProtectedRoute({ children, specialCareOnly = false }) {
  const user = getUser();
  const role = localStorage.getItem("role");

  if (!user || !role) return <Navigate to="/" replace />;
  if (specialCareOnly && role !== "specialCare") return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Registration Flow */}
        <Route path="/" element={<Register />} />
        <Route path="/roles" element={<RoleSelection />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

        {/* Special Care Section */}
        <Route path="/special-care" element={<ProtectedRoute specialCareOnly><SpecialCareDashboard /></ProtectedRoute>} />
        <Route path="/routine" element={<ProtectedRoute><RoutinePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
