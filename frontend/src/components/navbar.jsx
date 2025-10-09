import { Link, Navigate } from "react-router-dom";
import homeImg from "./img/home.png";
import profileImg from "./img/profile.png";
import aboutImg from "./img/about.png";
import loginImg from "./img/login.png";
import teamImg from "./img/team.png";

export default function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#eee", width: "100%", alignItems: "center", justifyContent: "center", display: "flex" }}>

      <Link to="/about">
        <img src={aboutImg} alt="About" style={{ width: "35px", height: "35px", cursor: "pointer", borderRadius: "8px", transition: "transform 0.2s ease", }} onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} /></Link> |{" "}
      <Link to="/profile">
        <img src={profileImg} alt="Perfil" style={{ width: "35px", height: "35px", cursor: "pointer", borderRadius: "8px", transition: "transform 0.2s ease", }} sdaonMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} /></Link>|{" "}
      <Link to="/" style={{ display: "inline-flex", alignItems: "center" }}>
        <img src={homeImg} alt="Inicio" style={{ width: "35px", height: "35px", cursor: "pointer", borderRadius: "8px", transition: "transform 0.2s ease", }} onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} /></Link>|{" "}
      <Link to="/login">
        <img src={loginImg} alt="Login" style={{ width: "35px", height: "35px", cursor: "pointer", borderRadius: "8px", transition: "transform 0.2s ease", }} onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} /></Link>|{" "}
      <Link to="/teams">
        <img src={teamImg} alt="Equipos" style={{ width: "35px", height: "35px", cursor: "pointer", borderRadius: "8px", transition: "transform 0.2s ease", }} onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} /></Link>
    </nav>
  );
}
