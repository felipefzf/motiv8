import tomy from '../assets/tomy.png';
import bici from '../assets/bicicleta.png';
import medalla from '../assets/medalla.png';
import objetivo from '../assets/objetivo.png';
import equipo from '../assets/equipo.png';
import './Profile.css';
import { Link } from 'react-router-dom';

export default function Profile() {
  return (
    <div className="profile-container">
      <h1 className="profile-title">MOTIV8</h1>
      <h2 className="profile-subtitle">Perfil</h2>

      <div className="profile-content">
        <img
          src={tomy}
          className="profile-image rounded-circle border border-warning"
          alt="Perfil"
        />
        <h4 className="profile-name">
          tms.pz <span className="profile-level">Nivel 7</span>
        </h4>
        <br />
        <p>Ubicación: <span className="profile-level">Ñuñoa, Chile</span></p>
        <p>Deporte Principal: <span className="profile-level">Ciclismo</span></p>

        <h3 className="section-title">Estadísticas</h3>
        <div className="container text-center">
          <div className="row row-cols-2">
            <div className="card-profile">
              <div className="card-body">
                <p>
                  Distancia: <span className="highlight">270 km</span>
                </p>
              </div>
            </div>
            <div className="card-profile">
              <div className="card-body">
                <p>
                  Tiempo: <span className="highlight">120 hrs</span>
                </p>
              </div>
            </div>
            <div className="card-profile">
              <div className="card-body">
                <p>
                  Misiones: <span className="highlight">45 Completadas</span>
                </p>
              </div>
            </div>
            <div className="card-profile">
              <div className="card-body">
                <p>
                  Insignias: <span className="highlight">8 Obtenidas</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <h3 className="section-title">Logros y Medallas</h3>
        <div className="achievements">
          <img src={bici} alt="Medalla 1" />
          <img src={medalla} alt="Medalla 2" />
          <img src={objetivo} alt="Medalla 3" />
          <img src={equipo} alt="Medalla 4" />
        </div>
        <br />
        <Link to="/" className="btn btn-danger">
          Cerrar Sesión
        </Link>
      </div>
    </div>
  );
}
