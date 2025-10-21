import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import Profile from "./pages/profile";
import Navbar from "./components/navbar";
import { Navigate } from "react-router-dom";
import Teams from "./pages/teams";
import Login from "./pages/login";
import Activities from "./pages/activities";
import Register from "./pages/register";
import MissionCreator from "./pages/missionCreator";
import MissionList from "./pages/missionList";
import LoginPage from "./pages/loginpage";
import AdminRoute from "./components/adminroute";
import AdminDashboard from "./pages/admindashboard";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/teams" element={<Teams/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/activities" element={<Activities/>} />
        <Route path="/*" element={<Navigate to="/" />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/missionList" element={<MissionList/>} />
        <Route path="/loginpage" element={<LoginPage/>} />

        <Route element={<AdminRoute />}>
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/missionCreator" element={<MissionCreator/>} />
        </Route>
      </Routes>
      <Navbar />
    </BrowserRouter>
  );
}

export default App;
