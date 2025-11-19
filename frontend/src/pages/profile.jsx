import React, { useEffect, useState } from "react";
import tomy from "../assets/tomy.png";
import "./Profile.css";
import { useAuth } from "../context/authContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
// (No necesitas signOut ni auth aquí, el contexto lo maneja)
import axios from "axios";
import EditAvatarModal from '../components/editAvatarModal.jsx'; 
import EditProfileModal from '../components/editProfileModal.jsx'; 

export default function Profile() {
  // 1. Usamos 'user' como la fuente de verdad para el perfil
  const { user, logout } = useAuth();
  
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");
  
  // const [perfil, setPerfil] = useState(null); // <-- BORRADO (Redundante)
  
  const [stats, setStats] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipo, setEquipo] = useState(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);

  // --- Carga de Datos Adicionales (Equipos, Stats, Ubicaciones) ---
  // Estos SÍ vale la pena traerlos aparte si no están dentro del objeto usuario
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("firebaseToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 1. Cargar Equipo
    axios.get("http://localhost:5000/api/teams/my-team", config)
      .then((res) => setEquipo(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setEquipo(null);
        else console.error("Error equipo:", err);
      });

    // 2. Cargar Estadísticas
    axios.get(`http://localhost:5000/api/userStats/${user.uid}`, config) // Asumo que esto necesita token
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error stats:", err));

    // 3. Cargar Ubicaciones
    axios.get("http://localhost:5000/api/user-locations", config)
      .then((res) => setUbicaciones(res.data))
      .catch((err) => console.error("Error ubicaciones:", err));
      
    // --- NOTA: BORRAMOS LA LLAMADA A /api/users/${user.uid} ---

  }, [user]);

  // Lógica del tema (sin cambios)
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

  // Renderizado seguro (ya no esperamos a 'perfil')
  if (!user) return <p>Cargando...</p>;

  return (
    <div className="profile-container">
      <button onClick={toggleTheme} className="theme-toggle-btn">
        {theme === "dark" ? "☀️ Tema Claro" : "🌙 Tema Oscuro"}
      </button>

      <h1 className="profile-title">MOTIV8</h1>
      <h2 className="profile-subtitle">Perfil</h2>

      <div className="profile-content">
        <img
          // Usamos user.profile_image_url DIRECTAMENTE del contexto
          src={user.profile_image_url || tomy} 
          className="profile-image rounded-circle border"
          alt="Perfil de usuario"
          style={{ objectFit: 'cover', width: '150px', height: '150px', display: 'block', margin: '0 auto' }} 
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
          style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9em', marginBottom: '10px' }}
        >
          Editar información
        </button>

        <h4 className="profile-name">
          {/* Usamos user.name DIRECTAMENTE */}
          {user.name || "Sin nombre"}{" "}
          <span className="profile-level">
            Lvl: {stats?.nivelActual || 1}
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
