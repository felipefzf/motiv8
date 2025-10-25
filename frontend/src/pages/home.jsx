import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css"; // Importa el CSS externo
import { Link } from "react-router-dom";

export default function Home() {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/hello")
      .then((res) => setMensaje(res.data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="home-container">
      <h1 className="home-title">MOTIV8</h1>
      <h3 className="home-subtitle">Inicio</h3>
      <p className="home-message">Backend dice: {mensaje}</p>

      <div className="missions-section">
        <h3 className="missions-title">Misiones de hoy</h3>

        <div className="container text-center">
          <div className="row row-cols-2">
            <div className="card-home">
              <div className="card-body">
                <p className="mission-text">Recorre 50 km</p>
                <div className="progress" role="progressbar">
                  <div className="progress-bar" style={{ width: "98%" }}>
                    98%
                  </div>
                </div>
              </div>
            </div>

            <div className="card-home">
              <div className="card-body">
                <p className="mission-text">Alcanza 35 km de velocidad</p>
                <div className="progress" role="progressbar">
                  <div className="progress-bar" style={{ width: "25%" }}>
                    25%
                  </div>
                </div>
              </div>
            </div>

            <div className="card-home">
              <div className="card-body">
                <p className="mission-text">Completa una misión</p>
                <div className="progress" role="progressbar">
                  <div className="progress-bar" style={{ width: "0%" }}>
                    0%
                  </div>
                </div>
              </div>
            </div>

            <div className="card-home">
              <div className="card-body">
                <p className="mission-text">3 horas en movimiento</p>
                <div className="progress" role="progressbar">
                  <div className="progress-bar" style={{ width: "78%" }}>
                    78%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Link to="/activityCreator" className="btn btn-warning">
        Registrar Actividad
      </Link>
    </div>
  );
}
