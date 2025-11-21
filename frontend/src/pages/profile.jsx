import React, { useEffect, useState } from "react";
import userDefaul from "../assets/userDefaul.jpg";
import "./Profile.css";
import { useAuth } from "../context/authContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EditAvatarModal from "../components/editAvatarModal.jsx";
import EditProfileModal from "../components/editProfileModal.jsx";
import Modal from "../components/modal.jsx";
import ProfileRewardModal from "../components/profileRewardModal.jsx";
import LiveToast from "../components/liveToast";

export default function Profile({ toggleTheme, setTeamColor }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");

  const [stats, setStats] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipo, setEquipo] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  // Estado para modal de recompensa
  const [isRewardModalOpen, setRewardModalOpen] = useState(false);
  // ✅ Estado para controlar si ya reclamó en este nivel

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
      setTeamColor(equipo.team_color || "#ffd000ff");
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

    const fetchActivities = async () => {
      const token = localStorage.getItem("firebaseToken");
      if (!token) return;

      try {
        const response = await fetch("/api/activities", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Error cargando actividades:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("firebaseToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

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

    axios
      .get(`http://localhost:5000/api/userStats/${user.uid}`, config)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error stats:", err));

    axios
      .get("http://localhost:5000/api/user-locations", config)
      .then((res) => setUbicaciones(res.data))
      .catch((err) => console.error("Error ubicaciones:", err));
  }, [user]);

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

  // Reclamar recompensa
  const reclamarRecompensa = async (option) => {
    const token = localStorage.getItem("firebaseToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/profile/reward",
        { option },
        config
      );
      setToastMessage(`🎉 ${res.data.recompensa}`);
      setToastKey((prev) => prev + 1);
      setRewardModalOpen(false);
      fetchStats();
    } catch (err) {
      if (err.response?.status === 403) {
        setToastMessage(
          "Ya reclamaste la recompensa en este nivel o no corresponde."
        );
        setToastKey((prev) => prev + 1);
        setRewardModalOpen(false);
      } else {
        console.error("Error reclamando recompensa:", err);
      }
    }
  };

  // ✅ Resetear hasClaimedReward cuando cambie el nivel

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
          src={user.profile_image_url || userDefaul}
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
            Lvl: {stats?.nivelActual || 1}{" "}
            {stats?.nivelActual % 2 === 0 && " 🎁"}
          </span>
        </h4>

        {stats && (
          <div className="progress-bar-container" style={{ marginTop: "10px" }}>
            <progress
              value={stats.puntos}
              max={stats.puntosParaSiguienteNivel + stats.puntos}
            ></progress>{" "}
            Próximo nivel: {stats?.nivelSiguiente || stats?.nivelActual + 1}
            {stats?.nivelSiguiente % 2 === 0 && " 🎁"}
            <p>(faltan {stats.puntosParaSiguienteNivel} XP)</p>
          </div>
        )}
        <br />

        {/* ✅ Botón de recompensa solo si no ha reclamado */}
        {stats &&
          stats.nivelActual % 2 === 0 &&
          stats.ultimoNivelRecompensado !== stats.nivelActual && (
            <button
              className="btn-recompensa"
              onClick={() => setRewardModalOpen(true)} // ✅ abre el modal
              style={{ marginTop: "10px" }}
            >
              Reclama tu recompensa 🎁
            </button>
          )}
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

        <h3 className="section-title">Historial de Actividades</h3>

        <div className="activities-list">
          {loadingActivities ? (
            <p>Cargando actividades...</p>
          ) : activities.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              Aún no tienes actividades registradas.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="activity-card"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "15px",
                    backgroundColor: "white", // O usa variables de tema
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        textTransform: "capitalize",
                        color: "#007bff",
                      }}
                    >
                      {activity.title || "Actividad"}
                    </span>
                    <span
                      style={{
                        fontWeight: "bold",
                        textTransform: "capitalize",
                        color: "#007bff",
                      }}
                    >
                      {activity.type || "Actividad"} activity
                    </span>
                    <span style={{ fontSize: "0.9em", color: "#666" }}>
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-around",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.8em",
                          display: "block",
                          color: "#888",
                        }}
                      >
                        Distancia
                      </span>
                      <strong>{activity.distance.toFixed(2)} km</strong>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.8em",
                          display: "block",
                          color: "#888",
                        }}
                      >
                        Tiempo
                      </span>
                      <strong>{(activity.time / 60).toFixed(0)} min</strong>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.8em",
                          display: "block",
                          color: "#888",
                        }}
                      >
                        Velocidad
                      </span>
                      <strong>{activity.avgSpeed.toFixed(1)} km/h</strong>
                    </div>
                  </div>

                  {/* (Opcional) Botón para ver detalles o mapa */}
                  {/* <button style={{ width: '100%', padding: '5px' }}>Ver Ruta</button> */}
                </div>
              ))}
            </div>
          )}
        </div>

        <br />
        <button onClick={handleLogout} className="btn-cerrarsesion">
          Cerrar Sesión
        </button>
      </div>

      <EditAvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        showToast={(msg) => {
          setToastMessage(msg);
          setToastKey((prev) => prev + 1);
        }}
      />
      <EditProfileModal
        isOpen={isInfoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        showToast={(msg) => {
          setToastMessage(msg);
          setToastKey((prev) => prev + 1);
        }}
      />
      <ProfileRewardModal
        isOpen={isRewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        onClaim={reclamarRecompensa}
      />
      {toastMessage && <LiveToast key={toastKey} message={toastMessage} />}
    </div>
  );
}
