// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/home";
import About from "./pages/about";
import Profile from "./pages/profile";
import Teams from "./pages/teams";
import Login from "./pages/login";
import Rankings from "./pages/rankings";
import Register from "./pages/register";
import MissionDashboard from "./pages/missionDashboard";
import AdminRoute from "./components/adminRoute";
import AdminDashboard from "./pages/adminDashboard";
import PublicRoute from "./components/publicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/mainLayout";
import ActivityCreator from "./pages/activityCreator";
import ActivityTracker from "./pages/activityTracker";
import Shop from "./pages/shop";

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  // 🎨 color del equipo global
  const [teamColor, setTeamColor] = useState(() => {
    return localStorage.getItem("teamColor") || "";
  });

  // aplicar tema y color de equipo cada vez que cambie theme o teamColor
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    if (teamColor) {
      document.documentElement.style.setProperty("--accent-color", teamColor);
      document.documentElement.style.setProperty("--shadow-color", teamColor);
    } else {
      // color por defecto según tema
      if (theme === "light") {
        document.documentElement.style.setProperty("--accent-color", "#0066cc");
        document.documentElement.style.setProperty("--shadow-color", "#0066cc");
      } else {
        document.documentElement.style.setProperty(
          "--accent-color",
          "#ffd000ff"
        );
        document.documentElement.style.setProperty(
          "--shadow-color",
          "#ffd000ff"
        );
      }
    }
  }, [theme, teamColor]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

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

            {/* Profile recibe toggleTheme y setTeamColor para limpiar al cerrar sesión */}
            <Route
              path="/profile"
              element={
                <Profile
                  toggleTheme={toggleTheme}
                  setTeamColor={setTeamColor}
                />
              }
            />

            {/* Teams recibe setTeamColor para aplicar color según equipo */}
            <Route
              path="/teams"
              element={<Teams setTeamColor={setTeamColor} />}
            />

            <Route path="/rankings" element={<Rankings />} />
            <Route path="/activityCreator" element={<ActivityCreator />} />
            <Route path="/activityTracker" element={<ActivityTracker />} />
            <Route path="/shop" element={<Shop />} />

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
