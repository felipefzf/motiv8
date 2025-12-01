// src/pages/Profile.jsx
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
import InventoryModal from "../components/inventoryModal.jsx";
import ProfileRewardModal from "../components/profileRewardModal.jsx";
import PencilImg from "../assets/pencil.png";
import LiveToast from "../components/liveToast";
import API_URL from "../config";
import EditGoalsModal from "../components/EditGoalsModal.jsx";
import ActivityMap from "../components/activityMap.jsx";
import Header from "../components/Header.jsx";
import Bicycle from "../assets/bicycle.png";
import Running from "../assets/run.png";

export default function Profile({ toggleTheme, setTeamColor }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");

  const [stats, setStats] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipo, setEquipo] = useState(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const [isInventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [myEvents, setMyEvents] = useState([]);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const [isRewardModalOpen, setRewardModalOpen] = useState(false);
  const [isGoalsModalOpen, setGoalsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('firebaseToken');
    
    fetch(`${API_URL}/api/user/events`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setMyEvents(data))
    .catch(console.error);
  }, [user]);

  // ⚡ Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const useTeamColor = localStorage.getItem("useTeamColor") === "true";
    const teamColor = localStorage.getItem("teamColor");

    if (useTeamColor && teamColor) {
      document.documentElement.style.setProperty("--accent-color", teamColor);
      document.documentElement.style.setProperty("--shadow-color", teamColor);
    } else {
      if (savedTheme === "light") {
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
  }, []);

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
      .get(`${API_URL}/api/profile-locations`, config)
      .then((res) => setUbicaciones(res.data))
      .catch((err) => console.error("Error ubicaciones:", err));
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("teamColor");
      localStorage.setItem("useTeamColor", "false");
      document.documentElement.style.removeProperty("--accent-color");
      document.documentElement.style.removeProperty("--shadow-color");
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

  if (!user) return <p>Cargando...</p>;

  const val = (value, unit) => (value ? `${value} ${unit}` : "--");

  return (
    <div className="page-with-header">
      <Header
        title="Perfil"
        rightContent={
          <div className="theme-toggle-switch">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === "light"}
                onChange={() => {
                  const newTheme = theme === "dark" ? "light" : "dark";
                  setTheme(newTheme);
                  document.documentElement.setAttribute("data-theme", newTheme);
                  localStorage.setItem("theme", newTheme);

                  const useTeamColor =
                    localStorage.getItem("useTeamColor") === "true";
                  const teamColor = localStorage.getItem("teamColor");

                  if (useTeamColor && teamColor) {
                    document.documentElement.style.setProperty(
                      "--accent-color",
                      teamColor
                    );
                    document.documentElement.style.setProperty(
                      "--shadow-color",
                      teamColor
                    );
                  } else {
                    if (newTheme === "light") {
                      document.documentElement.style.setProperty(
                        "--accent-color",
                        "#0066cc"
                      );
                      document.documentElement.style.setProperty(
                        "--shadow-color",
                        "#0066cc"
                      );
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

                  if (typeof toggleTheme === "function") toggleTheme();
                }}
              />
              <span className="slider round"></span>
            </label>
          </div>
        }
      />

      <div className="profile-container">
        <p>Coins: <span className="profile-highlight">{stats?.coins || 0}</span></p>
        
          {user.main_sport === 'Running' &&
            <img src={Running} alt="Running" className="sportIcon" />
          }
          {user.main_sport === 'Cycling' &&
            <img src={Bicycle} alt="Cycling" className="sportIcon" />
          }

        <div className="profile-content">
          <div className="profile-image-wrapper">
            <img
              src={user.profile_image_url || userDefaul}
              className="profile-image"
              alt="Perfil de usuario"
            />

            {/* Toggle estilo iPhone */}

            <button
              className="btn-inventory"
              onClick={() => setInventoryModalOpen(true)}
            >
              Inventario
            </button>
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

          <button className="edit-info" onClick={() => setInfoModalOpen(true)}>
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
              <div className="progress-bar-background">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${
                      (stats.puntos /
                        (stats.puntosParaSiguienteNivel + stats.puntos)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <div className="progress-bar-text">
                Próximo nivel: {stats?.nivelSiguiente || stats?.nivelActual + 1}{" "}
                (faltan {stats.puntosParaSiguienteNivel} XP)
              </div>
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
          {stats && stats.nivelActual % 2 === 0 && stats.ultimoNivelRecompensado !== stats.nivelActual && (
            <button className="btn-recompensa" onClick={() => setRewardModalOpen(true)}>
              Reclama tu recompensa 🎁
            </button>
          )}          

          <h3 className="section-title">Próximos Eventos</h3>
          <br />
              <div className="events-container">
                  {myEvents.length === 0 ? <p style={{fontStyle:'italic'}}>No tienes eventos próximos.</p> : myEvents.map(ev => (
                      <div key={ev.id} className="event-card">
                          <h5 className="ev-title">{ev.title}</h5>
                          <small className="team-name">{ev.teamName}</small>
                          <p className='event-date'>📅 {new Date(ev.date).toLocaleDateString()}</p>
                          <p className='event-route'>📍 {ev.route}</p>
                      </div>
                  ))}
              </div>

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
                Equipo:{" "}
                <span className="profile-level">{equipo.team_name}</span>
              </p>
            )}
          </div>

          <br />
          <h3 className="section-title" style={{ margin: 0 }}>
            Mi rendimiento
          </h3>
          <div className="container text-center" style={{ marginTop: "10px" }}>
            <div className="performance">
              <div className="card-profile">
                <div className="card-body performance-card-body">
                  <h5 className="performance-card-title">🏃‍♂️ Running</h5>
                  <p className="performance-text">
                    Ritmo:{" "}
                    <span className="highlight">
                      {val(user.performance?.running?.pace, "min/km")}
                    </span>
                  </p>
                  <p className="performance-text">
                    Distancia:{" "}
                    <span className="highlight">
                      {val(user.performance?.running?.distance, "km")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="card-profile">
                <div className="card-body performance-card-body">
                  <h5 className="performance-card-title">🚴‍♀️ Ciclismo</h5>
                  <p className="performance-text">
                    Velocidad:{" "}
                    <span className="highlight">
                      {val(user.performance?.cycling?.speed, "km/h")}
                    </span>
                  </p>
                  <p className="performance-text">
                    Distancia:{" "}
                    <span className="highlight">
                      {val(user.performance?.cycling?.distance, "km")}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            className="edit-performance"
            onClick={() => setGoalsModalOpen(true)}
          >
            Editar rendimiento
          </button>

          <br />
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
                  <div key={activity.id} className="activity-card">
                    <div className="activity-card-inner">
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

                      <div
                        className="activity-map-container"
                        style={{
                          height: "200px",
                          marginTop: "10px",
                          width: "100%",
                        }}
                      >
                        <ActivityMap
                          routeGeoJSON={activity.path}
                          start={activity.startLocation}
                          end={activity.endLocation}
                          interactive={false}
                        />
                      </div>

                      <div className="activity-card-stats">
                        <div>
                          <span className="activity-card-label">Distancia</span>
                          <p className="strong-label">
                            {activity.distance.toFixed(2)} km
                          </p>
                        </div>
                        <div>
                          <span className="activity-card-label">Tiempo</span>
                          <p className="strong-label">
                            {(activity.time / 60).toFixed(0)} min
                          </p>
                        </div>
                        <div>
                          <span className="activity-card-label">Velocidad</span>
                          <p className="strong-label">
                            {activity.avgSpeed.toFixed(1)} km/h
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="btn-cerrarsesion">
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Modales */}
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
      <EditGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setGoalsModalOpen(false)}
      />
      {toastMessage && <LiveToast key={toastKey} message={toastMessage} />}
    </div>
  );
}
