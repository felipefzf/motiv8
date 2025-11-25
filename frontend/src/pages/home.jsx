import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { io } from "socket.io-client"; // ✅ frontend client
import LiveToast from "../components/liveToast";
import API_URL from "../config";

export default function Home() {
  const [misiones, setMisiones] = useState([]);
  const [emparejados, setEmparejados] = useState({});
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();
  const [emparejandoEnCurso, setEmparejandoEnCurso] = useState({});
  const [eventosVistos, setEventosVistos] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [intentosAsignacion, setIntentosAsignacion] = useState(0);

  useEffect(() => {
    if (!socket || !user) return;

    misiones.forEach((m) => {
      // Revisamos si el usuario actual está en la lista de emparejados de esta misión
      const estaEmparejado = emparejados[m.id]?.some((u) => u.uid === user.uid);

      if (estaEmparejado) {
        socket.emit("joinMission", m.id);
      }
    });
  }, [emparejados, misiones, user, socket]);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Usamos un for...of para poder usar await dentro
      for (const m of misiones) {
        try {
          const res = await axios.get(`${API_URL}/api/match/${m.id}/events`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          res.data.forEach((event) => {
            // Verificamos si ya vimos este evento para no repetir la alerta
            const yaVisto = eventosVistos[m.id]?.includes(event.timestamp);

            if (!yaVisto) {
              alert(event.message); // Mostrar alerta

              // Marcar evento como visto
              setEventosVistos((prev) => ({
                ...prev,
                [m.id]: [...(prev[m.id] || []), event.timestamp],
              }));
            }
          });
        } catch (err) {
          // Ignoramos errores de consola para no saturar si no hay eventos
          // console.error("Error obteniendo eventos:", err);
        }
      }
    }, 5000);

    // Limpieza del intervalo al desmontar
    return () => clearInterval(interval);
  }, [misiones, token, eventosVistos]);

  // 🔑 Cargar misiones
  const fetchMisiones = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user-missions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMisiones(res.data);
    } catch (err) {
      console.error("Error obteniendo misiones:", err);
    }
  };

  // ✅ Conectar socket una vez
  useEffect(() => {
    if (!token) return;
    const s = io(`${API_URL}`, { auth: { token } });
    setSocket(s);

    s.on("missionCompleted", ({ missionId }) => {
      console.log("Misión completada en grupo:", missionId);
      fetchMisiones();
    });

    // ✅ escuchar cambios de emparejamiento en tiempo real
    s.on("pairingStatus", ({ missionId, users }) => {
      setEmparejados((prev) => ({ ...prev, [missionId]: users }));
    });

    return () => s.disconnect();
  }, [token]);

  // ✅ Unirse a salas cuando cambian las misiones
  useEffect(() => {
    if (!socket || misiones.length === 0) return;

    misiones.forEach((m) => {
      socket.emit("joinMission", m.id);

      // ✅ consulta inmediata al backend para no esperar polling
      axios
        .get(`${API_URL}/api/match/${m.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setEmparejados((prev) => ({ ...prev, [m.id]: res.data }));
        })
        .catch((err) => console.error("Error obteniendo emparejados:", err));
    });
  }, [socket, misiones, token]);

  // Reclamar recompensa
  const reclamarRecompensa = async (id) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/user-missions/claim`,
        { missionId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMisiones(res.data.missions);
      setToastMessage("🎉 Recompensa reclamada");
      setToastKey((prev) => prev + 1);

      await axios.post(
        `${API_URL}/api/match/stop`,
        { missionId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmparejados((prev) => ({
        ...prev,
        [id]: prev[id]?.filter((u) => u.uid !== user.uid) || [],
      }));

      await fetchMisiones();
    } catch (err) {
      console.error("Error reclamando recompensa:", err);
    }
  };

  useEffect(() => {
    misiones.forEach((m) => {
      const lista = emparejados[m.id];
      const yaEmparejado = lista?.some((u) => u.uid === user.uid);

      if (yaEmparejado) {
        setEmparejandoEnCurso((prev) => ({ ...prev, [m.id]: false }));
      }
    });
  }, [emparejados, misiones, user]);

  // Alternar emparejamiento
  const toggleEmparejar = async (missionId, isEmparejado) => {
    try {
      setEmparejandoEnCurso((prev) => ({ ...prev, [missionId]: true }));

      if (!isEmparejado) {
        await axios.post(
          `${API_URL}/api/match/start`,
          { missionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/match/stop`,
          {
            missionId,
            uid: user.uid,
            name: user.name,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // ✅ Eliminar al usuario del grupo localmente
        setEmparejados((prev) => ({
          ...prev,
          [missionId]: prev[missionId]?.filter((u) => u.uid !== user.uid) || [],
        }));

        setToastKey((prev) => prev + 1);
        // ✅ Aquí sí podemos apagar el estado porque ya sabemos que salió
        setEmparejandoEnCurso((prev) => ({ ...prev, [missionId]: false }));
      }
    } catch (err) {
      console.error("Error en emparejamiento:", err);
      setEmparejandoEnCurso((prev) => ({ ...prev, [missionId]: false }));
    }
  };

  useEffect(() => {
    if (!socket) return;

    misiones.forEach((m) => {
      const estaEmparejado = emparejados[m.id]?.some((u) => u.uid === user.uid);
      if (estaEmparejado) {
        socket.emit("joinMission", m.id);
      }
    });
  }, [socket, misiones, emparejados, user]);

  const agregarTresMisiones = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/user-missions/assign-3`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualiza contador y misiones con lo que dice el backend
      if (Array.isArray(res.data.missions)) {
        setMisiones(res.data.missions);
      }

      if (typeof res.data.assignClicks === "number") {
        setIntentosAsignacion(res.data.assignClicks);
        localStorage.setItem(
          `assignCount:${user.uid}`,
          String(res.data.assignClicks)
        );
      }

      if (res.data.limitReached) {
        setToastMessage("🏁 Has completado tus misiones semanales.");
      } else {
        setToastMessage("✅ Se asignaron 3 nuevas misiones");
      }
      setToastKey((prev) => prev + 1);
    } catch (err) {
      const msg =
        err.response?.data?.message || "No se pudieron asignar 3 misiones.";
      setToastMessage(msg);
      setToastKey((prev) => prev + 1);
    }
  };

  // Polling como respaldo (cada 10s en vez de 5s)
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const m of misiones) {
        try {
          const res = await axios.get(`${API_URL}/api/match/${m.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setEmparejados((prev) => ({ ...prev, [m.id]: res.data }));
        } catch (err) {
          console.error("Error obteniendo emparejados:", err);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [misiones, token]);

  useEffect(() => {
    if (!token) return;
    fetchMisiones();
  }, [token]);

  return (
    <div className="home-container">
      <h1 className="home-title">MOTIV8</h1>
      <h3 className="home-subtitle">Inicio</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h3 className="home-subtitle">Bienvenido, {user.name}</h3>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span>Ganas de entrenar?</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Link to="/activityTracker" className="btn-registrar">
          Registrar Actividad
        </Link>
      </div>

      <div className="missions-section">
        <h3 className="missions-title">Misiones asignadas</h3>
        <div className="container text-center">
          <div className="row row-cols-2">
            {misiones.map((mision, index) => {
              const progreso = mision.progressValue || 0;
              const porcentaje = Math.min(
                (progreso / mision.targetValue) * 100,
                100
              );
              const restante = Math.max(mision.targetValue - progreso, 0);

              const estaEmparejado = emparejados[mision.id]?.some(
                (u) => u.uid === user.uid
              );
              const estaEsperando = emparejandoEnCurso[mision.id];

              return (
                <div className="card-home" key={index}>
                  <div className="card-body">
                    <p className="mission-text">{mision.name}</p>
                    <p>Descripción: {mision.description}</p>
                    <p>
                      Objetivo: {mision.targetValue} {mision.unit}
                    </p>
                    <p>
                      Recompensa: {mision.reward} XP / {mision.coinReward} Coins
                    </p>

                    {mision.completed ? (
                      <button
                        className="btn-recompensa"
                        onClick={() => reclamarRecompensa(mision.id)}
                      >
                        Recoger recompensa
                      </button>
                    ) : (
                      <>
                        <progress
                          value={progreso}
                          max={mision.targetValue}
                        ></progress>
                        <p>{porcentaje.toFixed(1)}% completado</p>
                        <p>
                          Te faltan {restante.toFixed(1)} {mision.unit}
                        </p>

                        <button
                          className="btn-emparejar"
                          onClick={() =>
                            toggleEmparejar(mision.id, estaEmparejado)
                          }
                          disabled={estaEsperando}
                        >
                          {estaEsperando
                            ? "EMPAREJANDO..."
                            : estaEmparejado
                            ? "DISOLVER"
                            : "EMPAREJAR"}
                        </button>

                        {emparejados[mision.id]?.length > 0 && (
                          <div className="emparejados-list">
                            <h5>Usuarios emparejados:</h5>
                            <ul>
                              {emparejados[mision.id].map((u) => (
                                <li key={u.uid}>
                                  {u.name} (Nivel {u.nivel})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {misiones.length === 0 && (
          <button
            onClick={agregarTresMisiones}
            disabled={intentosAsignacion >= 3}
          >
            {intentosAsignacion >= 3
              ? "Completaste tus misiones semanales"
              : "Agregar 3 misiones"}
          </button>
        )}
      </div>

      {toastMessage && <LiveToast key={toastKey} message={toastMessage} />}
    </div>
  );
}
