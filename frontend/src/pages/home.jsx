import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css"; // Importa el CSS externo
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function Home() {
  const [misiones, setMisiones] = useState([]);

  

  const { token } = useAuth();
  const completarMision = (id) => {
  axios
    .post("http://localhost:5000/api/user-missions/complete", { missionId: id }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setMisiones(res.data.missions);
      alert("🎉 Misión completada"); // ← Aquí aparece la alerta
    })
    .catch((err) => console.error("Error al completar misión:", err));
};


  const agregarTresMisiones = () => {
    axios
      .post(
        "http://localhost:5000/api/user-missions/assign-3",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        setMisiones(res.data.missions); // ← reemplaza con las 3 nuevas
      })
      .catch((err) => {
        console.error("Error al agregar 3 misiones:", err);
        alert("No se pudieron asignar 3 misiones.");
      });
  };

  useEffect(() => {
    if (!token) return; // Espera a que el token esté disponible

    axios
      .get("http://localhost:5000/api/user-missions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMisiones(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          // Si no hay misiones asignadas, asignar nuevas
          axios
            .post(
              "http://localhost:5000/api/user-missions/assign",
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then((res) => setMisiones(res.data.missions))
            .catch((err) => console.error("Error asignando misiones:", err));
        } else {
          console.error("Error obteniendo misiones:", err);
        }
      });
  }, [token]);

  return (
    <div className="home-container">
      <h1 className="home-title">MOTIV8</h1>
      <h3 className="home-subtitle">Inicio</h3>

      <div className="missions-section">
        <h3 className="missions-title">Misiones asignadas</h3>
        <br />
        <div className="container text-center">
          <div className="row row-cols-2">
            {misiones.map((mision, index) => (
              <div className="card-home" key={index}>
                <div className="card-body">
                  <p className="mission-text">{mision.name}</p>
                  <p>Descripcion: {mision.description}</p>
                  <p>
                    Objetivo: {mision.targetValue}
                    {mision.unit}
                  </p>
                  <p>Recompensa: {mision.reward}pts</p>
                  <button className="btn-solo ">
                    HACER EN SOLITARIO
                  </button>
                  <button className="btn-emparejar">EMPAREJAR</button>
                  <button
                    className="btn-completar"
                    onClick={() => completarMision(mision.id)}
                  >
                    COMPLETADO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button className="btn btn-dark mb-3" onClick={agregarTresMisiones}>
        AGREGAR 3 MISIONES
      </button>
      <Link to="/activityCreator" className="btn-registrar">
        Registrar Actividad
      </Link>
    </div>
  );
}