import React, { useEffect, useState } from "react";
import tomy from "../assets/tomy.png";
import "./Profile.css";
import { useAuth } from "../context/authContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
// (No necesitas signOut ni auth aquí, el contexto lo maneja)
import axios from "axios";
import EditAvatarModal from "../components/editAvatarModal.jsx";
import EditProfileModal from "../components/editProfileModal.jsx";

export default function Profile({ toggleTheme, setTeamColor }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");

  // const [perfil, setPerfil] = useState(null); // <-- BORRADO (Redundante)

  const [stats, setStats] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipo, setEquipo] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);

  // --- Carga de Datos Adicionales (Equipos, Stats, Ubicaciones) ---
  // Estos SÍ vale la pena traerlos aparte si no están dentro del objeto usuario
  const fetchStats = async () => {
    if (!user) return;
    const token = localStorage.getItem("firebaseToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const res = await axios.get(
        `http://localhost:5000/api/userStats/${user.uid}`,
        config
      );
      setStats(res.data);
    } catch (err) {
      console.error("Error stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (equipo && typeof setTeamColor === "function") {
      setTeamColor(equipo.team_color || "#ffd000ff"); // fallback si no hay color

      // Aplicar color del equipo como variables CSS
      document.documentElement.style.setProperty(
        "--accent-color",
        equipo.team_color || "#ffd000ff"
      );
      document.documentElement.style.setProperty(
        "--shadow-color",
        equipo.team_color || "#ffd000ff"
      );
    }
  }, [equipo]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("firebaseToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 1. Cargar Equipo
    axios
      .get("http://localhost:5000/api/teams/my-team", config)
      .then((res) => setEquipo(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setEquipo(null);
        } else {
          console.error("Error obteniendo equipo:", err);
        }
      });

    // 2. Cargar Estadísticas
    axios
      .get(`http://localhost:5000/api/userStats/${user.uid}`, config) // Asumo que esto necesita token
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error stats:", err));

    // 3. Cargar Ubicaciones
    axios
      .get("http://localhost:5000/api/user-locations", config)
      .then((res) => setUbicaciones(res.data))
      .catch((err) => console.error("Error ubicaciones:", err));

    // --- NOTA: BORRAMOS LA LLAMADA A /api/users/${user.uid} ---
  }, [user]);

  // Lógica del tema (sin cambios)
  // Tema inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    if (typeof toggleTheme === "function") {
      toggleTheme();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("teamColor");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Renderizado seguro (ya no esperamos a 'perfil')
  if (!user) return <p>Cargando...</p>;

  return (
    <div className="profile-container">
      <button onClick={handleToggleTheme} className="theme-toggle-btn">
        {theme === "dark" ? "☀️ Tema Claro" : "🌙 Tema Oscuro"}
      </button>

      <h1 className="profile-title">MOTIV8</h1>
      <h2 className="profile-subtitle">Perfil</h2>
      <p>
        Coins: <span className="profile-highlight">{stats?.coins || 0}</span>
      </p>
      <div className="profile-content">
        <img
          // Usamos user.profile_image_url DIRECTAMENTE del contexto
          src={user.profile_image_url || tomy}
          className="profile-image rounded-circle border"
          alt="Perfil de usuario"
          style={{
            objectFit: "cover",
            width: "150px",
            height: "150px",
            display: "block",
            margin: "0 auto",
          }}
        />

        <div style={{ marginTop: 15, marginBottom: 15 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setAvatarModalOpen(true)}
          >
            Cambiar foto
          </button>
        </div>

        <button
          onClick={() => setInfoModalOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "0.9em",
            marginBottom: "10px",
          }}
        >
          Editar información
        </button>

        <h4 className="profile-name">
          {user?.name || "Sin nombre"}{" "}
          <span className="profile-level">
            Lvl: {stats?.nivelActual || 1} xp {stats?.puntos || 0} /{" "}
            {stats?.puntosParaSiguienteNivel || 0} lvl:{" "}
            {stats?.nivelSiguiente || stats?.nivelActual + 1}{" "}
          </span>
        </h4>
        <br />

        <p>
          Ubicación:{" "}
          <span className="profile-level">
            {/* Usamos user.comuna DIRECTAMENTE */}
            {user.comuna || "No definida"}, {user.region || "Chile"}
          </span>
        </p>

        <div>
          Deporte Principal:{" "}
          <span className="profile-level">
            {/* Usamos user.main_sport DIRECTAMENTE (si lo agregaste al objeto user en backend)
               Si no lo tienes en user, entonces sí necesitarías 'perfil', 
               pero lo ideal es que /auth/me te devuelva todo. 
            */}
            {user.main_sport || (equipo ? equipo.sport_type : "Agente libre")}
          </span>
          {equipo && (
            <p>
              <br />
              Equipo: <span className="profile-level">{equipo.team_name}</span>
            </p>
          )}
        </div>

        {/* ... (El resto de estadísticas, logros y botón logout igual) ... */}
        <h3 className="section-title">Estadísticas</h3>
        {/* ... */}
        <br />
        <div className="container text-center">
          <p>
            Distancia total:{" "}
            <span className="profile-highlight">
              {stats?.distanciaTotalKm || 0} km
            </span>
          </p>
          <p>
            Tiempo total:{" "}
            <span className="profile-highlight">
              {stats?.tiempoTotalRecorridoMin || 0} min
            </span>
          </p>
          <p>
            Velocidad máxima:{" "}
            <span className="profile-highlight">
              {stats?.velocidadMaximaKmh || 0} km/h
            </span>
          </p>
          <p>
            Misiones completadas:{" "}
            <span className="profile-highlight">
              {stats?.misionesCompletas || 0}
            </span>
          </p>
          <p>
            Insignias ganadas:{" "}
            <span className="profile-highlight">
              {stats?.insigniasGanadas || 0}
            </span>
          </p>
        </div>

        <h3 className="section-title">Ubicaciones visitadas</h3>
        <div className="locations-container">
          {ubicaciones.length > 0 ? (
            ubicaciones.map((loc, i) => (
              <span key={i} className="ubi-list">
                {loc}
              </span>
            ))
          ) : (
            <p>No hay ubicaciones registradas</p>
          )}
        </div>

        <h3 className="section-title">Logros y Medallas</h3>
        <div className="achievements"></div>

        <br />
        <button onClick={handleLogout} className="btn-cerrarsesion">
          Cerrar Sesión
        </button>
      </div>

      <EditAvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
      <EditProfileModal
        isOpen={isInfoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />
    </div>
  );
}
