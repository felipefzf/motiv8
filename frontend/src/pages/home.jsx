import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/hello")
      .then(res => setMensaje(res.data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ color: '#fff', padding: '20px' }}>
      <h1 style={{ margin: 0, color: '#ffd000ff' }}>MOTIV8</h1>
      <h3 style={{ margin: '5px 0 10px 0' }}>Inicio</h3>
      <p style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>Backend dice: {mensaje}</p>
      <br />
      <div>
        <h3 style={{ margin: 0, color: '#ffd000ff', justifyContent: 'center', display: 'flex' }}>Misiones de hoy</h3>
        <br />
        <div className="container text-center">
          <div className="row row-cols-2">
            <div className="card">
              <div className="card-body">
                <p style={{ color: '#ffd000ff' }}>
                  Recorre 20 km
                </p>
                <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-bar" style={{ width: '98%' }}>98%</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p>
                  Tiempo: <span className="highlight">120 hrs</span>
                </p>
                <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-bar" style={{ width: '25%' }}>25%</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p>
                  Misiones: <span className="highlight">45 Completadas</span>
                </p>
                <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-bar" style={{ width: '56%' }}>56%</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p>
                  Insignias: <span className="highlight">8 Obtenidas</span>
                </p>
                <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-bar" style={{ width: '78%' }}>78%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}