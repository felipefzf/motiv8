// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/home";
import About from "./pages/about";
import Profile from "./pages/profile";
import Teams from "./pages/teams";
import Login from "./pages/login";
import Activities from "./pages/activities";
import Register from "./pages/register";
import MissionDashboard from "./pages/missionDashboard";
import AdminRoute from "./components/adminRoute";
import AdminDashboard from "./pages/adminDashboard";
import PublicRoute from "./components/publicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/mainLayout";
import ActivityCreator from "./pages/activityCreator";
import ActivityTracker from "./pages/activityTracker";

function App() {
  // 1️⃣ Estado del tema
  const [theme, setTheme] = useState(() => {
    // Intenta obtener el tema guardado, o usa "dark" por defecto
    return localStorage.getItem("theme") || "dark";
  });

  // 2️⃣ Cada vez que cambia el tema, actualiza <html> y guarda en localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 3️⃣ Función para cambiar tema
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<Login />} />
        </Route>

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/about" element={<About />} />
            {/* 🔆 Pasamos toggleTheme solo al perfil */}
            <Route path="/profile" element={<Profile toggleTheme={toggleTheme} />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/activityCreator" element={<ActivityCreator />} />
            <Route path="/activityTracker" element={<ActivityTracker />} />
            <Route element={<AdminRoute />}>
              <Route path="/admindashboard" element={<AdminDashboard />} />
              <Route path="/missionDashboard" element={<MissionDashboard />} />
              <Route path="/*" element={<Home />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
