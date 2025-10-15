import "./i18n";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import RoleSelection from "./pages/RoleSelection";
import HomePage from "./pages/HomePage";
import SpecialCareDashboard from "./pages/SpecialCareDashboard";
import RoutinePage from "./pages/RoutinePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Registration Flow */}
        <Route path="/" element={<Register />} />
        <Route path="/roles" element={<RoleSelection />} />
        <Route path="/home" element={<HomePage />} />

        {/* Special Care Section */}
        <Route path="/special-care" element={<SpecialCareDashboard />} />
        <Route path="/routine" element={<RoutinePage />} />
      </Routes>
    </BrowserRouter>
  );
}
