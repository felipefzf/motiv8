import team from '../assets/equipo1.png';
import bici from '../assets/bicicleta.png';
import medalla from '../assets/medalla.png';
import objetivo from '../assets/objetivo.png';
import equipo from '../assets/equipo.png';
import './Teams.css';
import { Link } from 'react-router-dom';

export default function Teams() {
  return (
    <div className="teams-container">
      <h1 className="teams-title">MOTIV8</h1>
      <h2 className="teams-subtitle">Equipos</h2>

      <div className="teams-content">
        <img
          src={team}
          className="teams-image rounded-circle border border-warning"
          alt="Equipo"
        />
        <h4 className="teams-name">
          Shadow Crew <span className="highlight">Nivel 23</span>
        </h4>
        <p>Ubicación: <span className="highlight">Santiago, Chile</span></p>
        <p>Deporte Principal: <span className="highlight">Ciclismo</span></p>
        <p>Miembros: <span className="highlight">3</span></p>

        <h3 className="section-title">Estadísticas</h3>
        <div className="container text-center">
          <div className="row row-cols-2">
            <div className="card-team">
              <div className="card-body">
                <p>Distancia: <span className="highlight">1358 km</span></p>
              </div>
            </div>
            <div className="card-team">
              <div className="card-body">
                <p>Tiempo: <span className="highlight">240 hrs</span></p>
              </div>
            </div>
            <div className="card-team">
              <div className="card-body">
                <p>Misiones: <span className="highlight">90 Completadas</span></p>
              </div>
            </div>
            <div className="card-team">
              <div className="card-body">
                <p>Insignias: <span className="highlight">9 Obtenidas</span></p>
              </div>
            </div>
          </div>
        </div>

        <h3 className="section-title">Miembros</h3>
        <p>tms.pz - <span className="highlight">Nivel 7</span></p>
        <p>Uncol - <span className="highlight">Nivel 6</span></p>
        <p>PabloIg1 - <span className="highlight">Nivel 4</span></p>

        <h3 className="section-title">Logros y Medallas</h3>
        <div className="achievements">
          <img src={bici} alt="Medalla 1" />
          <img src={medalla} alt="Medalla 2" />
          <img src={objetivo} alt="Medalla 3" />
          <img src={equipo} alt="Medalla 4" />
        </div>
        <br />
        <button type="button" className="btn btn-danger" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
        Abandonar Equipo
      </button>
      </div>
      
      <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="staticBackdropLabel">Quieres abandonar al Equipo?</h1>            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" aria-label="Close"><Link to="/" className="btn btn-danger">
          Abandonar Equipo
        </Link></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
