import React, { useEffect, useState } from "react";
import tomy from "../assets/tomy.png";
import "./Profile.css";
import { useAuth } from "../context/authContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EditAvatarModal from "../components/editAvatarModal.jsx";
import EditProfileModal from "../components/editProfileModal.jsx";
import Modal from "../components/modal.jsx";
import InventoryModal from "../components/inventoryModal.jsx";
import ProfileRewardModal from "../components/profileRewardModal.jsx";
<<<<<<< Updated upstream
import PencilImg from "../assets/pencil.png";
import LiveToast from "../components/liveToast";
=======
import API_URL from "../config";
>>>>>>> Stashed changes

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
  const [isInventoryModalOpen, setInventoryModalOpen] = useState(false);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  // Estado para modal de recompensa
  const [isRewardModalOpen, setRewardModalOpen] = useState(false);

  const fetchStats = async () => {
    if (!user) return;
    const token = localStorage.getItem("firebaseToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const res = await axios.get(
        `${API_URL}/api/userStats/${user.uid}`,
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
  }, [equipo, setTeamColor]);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      const token = localStorage.getItem("firebaseToken");
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/activities`, {
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
      .get(`${API_URL}/api/teams/my-team`, config)
      .then((res) => setEquipo(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setEquipo(null);
        } else {
          console.error("Error obteniendo equipo:", err);
        }
      });

    axios
      .get(`${API_URL}/api/userStats/${user.uid}`, config)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error stats:", err));

    axios
      .get(`${API_URL}/api/user-locations`, config)
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

  const reclamarRecompensa = async (option) => {
    const token = localStorage.getItem("firebaseToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const res = await axios.post(
        `${API_URL}/api/profile/reward`,
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

      <button
        className="btn-inventory"
        onClick={() => setInventoryModalOpen(true)}
      >
        Inventario
      </button>

      <h1 className="profile-title">MOTIV8</h1>
      <h2 className="profile-subtitle">Perfil</h2>
      <p>
        Coins: <span className="profile-highlight">{stats?.coins || 0}</span>
      </p>

      <div className="profile-content">
        {/* FOTO + BOTÓN FLOTANTE */}
        <div className="profile-image-wrapper">
          <img
            src={user.profile_image_url || tomy}
            className="profile-image"
            alt="Perfil de usuario"
          />

          <button
            className="change-foto"
            onClick={() => setAvatarModalOpen(true)}
          >
            <img
              src={PencilImg}
              alt="Icono lápiz"
              className="change-foto-icon"
            />
          </button>
        </div>

        <button
          className="edit-info"
          onClick={() => setInfoModalOpen(true)}
        >
          Editar información
        </button>

        <br />

        <h4 className="profile-name">
          {user?.name || "Sin nombre"}{" "}
          <span className="profile-level">
            Lvl: {stats?.nivelActual || 1}{" "}
            {stats?.nivelActual % 2 === 0 && " 🎁"}
          </span>
        </h4>

        {stats && (
          <div className="progress-bar-container">
            <progress
              value={stats.puntos}
              max={stats.puntosParaSiguienteNivel + stats.puntos}
            ></progress>{" "}
            Próximo nivel: {stats?.nivelSiguiente || stats?.nivelActual + 1}
            {stats?.nivelSiguiente % 2 === 0 && " 🎁"}
            <p>(faltan {stats.puntosParaSiguienteNivel} XP)</p>
          </div>
        )}

        {stats &&
          stats.nivelActual % 2 === 0 &&
          stats.ultimoNivelRecompensado !== stats.nivelActual && (
            <button
              className="btn-recompensa"
              onClick={() => setRewardModalOpen(true)}
            >
              Reclama tu recompensa 🎁
            </button>
          )}

        <br />

        <p>
          Ubicación:{" "}
          <span className="profile-level">
            {user.comuna || "No definida"}, {user.region || "Chile"}
          </span>
        </p>

        <div>
          Deporte Principal:{" "}
          <span className="profile-level">
            {user.main_sport || (equipo ? equipo.sport_type : "Agente libre")}
          </span>
          {equipo && (
            <p>
              <br />
              Equipo: <span className="profile-level">{equipo.team_name}</span>
            </p>
          )}
        </div>

        <h3 className="section-title">Estadísticas</h3>

        <br />
        <div className="stats-container">
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
            <p className="activities-empty">
              Aún no tienes actividades registradas.
            </p>
          ) : (
            <div className="activities-wrapper">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="activity-card activity-card-inner"
                >
                  <div className="activity-card-header">
                    <span className="activity-card-title">
                      {activity.title || "Actividad"}
                    </span>
                    <span className="activity-card-type">
                      {activity.type || "Actividad"} activity
                    </span>
                    <span className="activity-card-date">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="activity-card-stats">
                    <div>
                      <span className="activity-card-label">Distancia</span>
                      <strong>{activity.distance.toFixed(2)} km</strong>
                    </div>
                    <div>
                      <span className="activity-card-label">Tiempo</span>
                      <strong>{(activity.time / 60).toFixed(0)} min</strong>
                    </div>
                    <div>
                      <span className="activity-card-label">Velocidad</span>
                      <strong>{activity.avgSpeed.toFixed(1)} km/h</strong>
                    </div>
                  </div>
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
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setInventoryModalOpen(false)}
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
