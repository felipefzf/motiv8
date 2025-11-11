import React, { useEffect, useState } from "react";
import tomy from "../assets/tomy.png";
import bici from "../assets/bicicleta.png";
import medalla from "../assets/medalla.png";
import objetivo from "../assets/objetivo.png";
import equipo from "../assets/equipo.png";
import "./Profile.css";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import axios from "axios";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);

  // Cambiar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Cargar datos del perfil y estadísticas
  useEffect(() => {
    if (!user) return;

    axios
      .get(`http://localhost:5000/api/users/${user.uid}`)
      .then((res) => setPerfil(res.data))
      .catch((err) => console.error("Error obteniendo perfil:", err));

    axios
      .get(`http://localhost:5000/api/userStats/${user.uid}`)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error obteniendo estadísticas:", err));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    axios
      .get("http://localhost:5000/api/user-locations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("firebaseToken")}`,
        },
      })
      .then((res) => setUbicaciones(res.data))
      .catch((err) => console.error("Error obteniendo ubicaciones:", err));
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("userRole");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // ✅ Renderizado seguro
  if (!user || !perfil || !stats) {
    return <p>Cargando perfil...</p>;
  }

  return (
    <div className="profile-container">
      <button onClick={toggleTheme} className="theme-toggle-btn">
        {theme === "dark" ? "☀️ Tema Claro" : "🌙 Tema Oscuro"}
      </button>

      <h1 className="profile-title">MOTIV8</h1>
      <h2 className="profile-subtitle">Perfil</h2>

      <div className="profile-content">
        <img
          src={tomy}
          className="profile-image rounded-circle border"
          alt="Perfil"
        />
        <h4 className="profile-name">
          {perfil?.name || "Sin nombre"}{" "}
          <span className="profile-level">Nivel 7</span>
        </h4>
        <br />
        <p>
          Ubicación:{" "}
          <span className="profile-level">
            {perfil?.comuna || "No definida"}, {perfil?.region || "Chile"}
          </span>
        </p>
        <p>
          Deporte Principal: <span className="profile-level">Ciclismo</span>
        </p>

        <h3 className="section-title">Estadísticas</h3>
        <div className="container text-center">
          <p>Distancia total: {stats?.distanciaTotalKm || 0} km</p>
          <p>Tiempo total: {stats?.tiempoTotalRecorridoMin || 0} min</p>
          <p>Velocidad máxima: {stats?.velocidadMaximaKmh || 0} km/h</p>
          <p>Misiones completadas: {stats?.misionesCompletas || 0}</p>
          <p>Insignias ganadas: {stats?.insigniasGanadas || 0}</p>
        </div>
        
<h3 className="section-title">Ubicaciones visitadas</h3>
<div className="locations-container">
  {ubicaciones.length > 0 ? (
    ubicaciones.map((loc, i) => (
      <span key={i} className="badge bg-primary m-1">{loc}</span>
    ))
  ) : (
    <p>No hay ubicaciones registradas</p>
  )}
</div>


        <h3 className="section-title">Logros y Medallas</h3>
        <div className="achievements">
          <img src={bici} alt="Medalla 1" />
          <img src={medalla} alt="Medalla 2" />
          <img src={objetivo} alt="Medalla 3" />
          <img src={equipo} alt="Medalla 4" />
        </div>

        <br />
        <button onClick={handleLogout} className="btn-cerrarsesion">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
