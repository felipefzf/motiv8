import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function Home() {
  const [misiones, setMisiones] = useState([]);
  const [emparejados, setEmparejados] = useState({});
  const { token, user } = useAuth();

  // Reclamar recompensa y disolver emparejamiento
  const reclamarRecompensa = async (id) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/user-missions/claim",
        { missionId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMisiones(res.data.missions);
      alert("🎉 Recompensa reclamada");

      // disolver emparejamiento al completar misión
      await axios.post(
        "http://localhost:5000/api/match/stop",
        { missionId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmparejados((prev) => ({ ...prev, [id]: [] }));
    } catch (err) {
      console.error("Error reclamando recompensa:", err);
    }
  };

  // Alternar emparejamiento
  const toggleEmparejar = async (missionId, isEmparejando) => {
    try {
      if (!isEmparejando) {
        await axios.post(
          "http://localhost:5000/api/match/start",
          { missionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/match/stop",
          { missionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEmparejados((prev) => ({ ...prev, [missionId]: [] }));
      }
    } catch (err) {
      console.error("Error en emparejamiento:", err);
    }
  };

  const agregarTresMisiones = () => {
    // Si el usuario aún tiene misiones activas, no permitir agregar nuevas
    if (misiones.length > 0) {
      alert(
        "❌ No puedes agregar nuevas misiones hasta completar todas las actuales."
      );
      return;
    }

    axios
      .post(
        "http://localhost:5000/api/user-missions/assign-3",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        setMisiones(res.data.missions);
        alert("✅ Se asignaron 3 nuevas misiones");
      })
      .catch((err) => {
        console.error("Error al agregar 3 misiones:", err);
        alert("No se pudieron asignar 3 misiones.");
      });
  };

  // Polling para obtener usuarios emparejados
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const m of misiones) {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/match/${m.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setEmparejados((prev) => ({ ...prev, [m.id]: res.data }));
        } catch (err) {
          console.error("Error obteniendo emparejados:", err);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [misiones, token]);

  // Cargar misiones
  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5000/api/user-missions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMisiones(res.data))
      .catch((err) => console.error("Error obteniendo misiones:", err));
  }, [token]);

  return (
    <div className="home-container">
      <h1 className="home-title">MOTIV8</h1>
      <h3 className="home-subtitle">Inicio</h3>

      <div className="missions-section">
        <h3 className="missions-title">Misiones asignadas</h3>
        <div className="container text-center">
          <div className="row row-cols-2">
            {misiones.map((mision, index) => {
              const progreso = mision.progressValue || 0;
              const porcentaje = Math.min((progreso / mision.targetValue) * 100, 100);
              const restante = Math.max(mision.targetValue - progreso, 0);
              const isEmparejando = emparejados[mision.id]?.some(u => u.uid === user.uid);

              return (
                <div className="card-home" key={index}>
                  <div className="card-body">
                    <p className="mission-text">{mision.name}</p>
                    <p>Descripción: {mision.description}</p>
                    <p>Objetivo: {mision.targetValue} {mision.unit}</p>
                    <p>Recompensa: {mision.reward} XP / {mision.coinReward} Coins</p>

                    {mision.completed ? (
                      <button className="btn-recompensa" onClick={() => reclamarRecompensa(mision.id)}>
                        Recoger recompensa
                      </button>
                    ) : (
                      <>
                        <progress value={progreso} max={mision.targetValue}></progress>
                        <p>{porcentaje.toFixed(1)}% completado</p>
                        <p>Te faltan {restante.toFixed(1)} {mision.unit}</p>

                        <button className="btn-solo">HACER EN SOLITARIO</button>
                        <button
                          className="btn-emparejar"
                          onClick={() => toggleEmparejar(mision.id, isEmparejando)}
                        >
                          {isEmparejando ? "STOP" : "EMPAREJAR"}
                        </button>

                        {/* Mostrar usuarios emparejados */}
                        {emparejados[mision.id]?.length > 0 && (
                          <div className="emparejados-list">
                            <h5>Usuarios emparejados:</h5>
                            <ul>
                              {emparejados[mision.id].map((u) => (
                                <li key={u.uid}>{u.name} (Nivel {u.nivel})</li>
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

      {misiones.length === 0 && (
        <button className="btn btn-dark mb-3" onClick={() => agregarTresMisiones()}>
          AGREGAR 3 MISIONES
        </button>
      )}

      <Link to="/activityCreator" className="btn-registrar">Registrar Actividad</Link>
    </div>
  );
}
