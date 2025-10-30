import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas(acceso a usuarios no logueados) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<Login/>} />
        </Route>

        {/* Rutas protegidas(acceso a usuarios logueados) */}
        <Route element={<ProtectedRoute />}>
          {/* Layout de navBar para rutas protegidas */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/teams" element={<Teams/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/activities" element={<Activities/>} />
            <Route path="/activityCreator" element={<ActivityCreator/>} />
            <Route path="/activityTracker" element={<ActivityTracker/>} />
            {/* Rutas protegidas para administradores */}
            <Route element={<AdminRoute />}>
              <Route path="/admindashboard" element={<AdminDashboard />} />
              <Route path="/missionDashboard" element={<MissionDashboard/>} />
              <Route path="/*" element={<Home/>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
