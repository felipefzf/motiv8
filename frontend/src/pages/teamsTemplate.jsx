import teamfoto from "../assets/equipo1.png";
import bici from "../assets/bicicleta.png";
import medalla from "../assets/medalla.png";
import objetivo from "../assets/objetivo.png";
import equipo from "../assets/equipo.png";
import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import axios from "axios";
import "./Teams.css";
import { Link } from "react-router-dom";

export default function Teams() {
  const [team, setTeam] = useState(null);
  const [membersInfo, setMembersInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLeaveTeam = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Debes iniciar sesión para abandonar el equipo.");
      return;
    }

    try {
      await axios.post(`http://localhost:5000/teams/${team.id}/leave`, {
        uid: user.uid,
      });

      alert("Has abandonado el equipo.");
      setTeam(null); // Limpia el estado
      setMembersInfo([]); // Limpia la lista de miembros
    } catch (error) {
      console.error("Error al abandonar el equipo:", error);
      alert(error.response?.data?.error || "Error al abandonar el equipo.");
    }
  };

  const fetchUserTeam = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Obtener el equipo del usuario
      const response = await axios.get(
        `http://localhost:5000/teams/user/${user.uid}`
      );
      setTeam(response.data);
      

      // Obtener información de los miembros
      const membersRes = await axios.post(
        "http://localhost:5000/teams/members",
        {
          uids: response.data.miembros,
        }
      );
      setMembersInfo(membersRes.data);
    } catch (error) {
      console.error("Error al obtener el equipo o miembros:", error);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTeam();
  }, []);

  if (loading) return <p>Cargando equipo...</p>;

  if (!team) return <p>No estás unido a ningún equipo.</p>;

  return (
    <div className="teams-container">
      <h1 className="teams-title">MOTIV8</h1>
      <h2 className="teams-subtitle">Equipos</h2>

      <div className="teams-content">
        <img
          src={teamfoto}
          className="teams-image rounded-circle border border-warning"
          alt="Equipo"
        />
        <h4 className="teams-name">
          {team.nombreEquipo} <span className="highlight">Nivel 23</span>
        </h4>
        <p>
          Ubicación: <span className="highlight">Santiago, Chile</span>
        </p>
        <p>
          Deporte Principal:{" "}
          <span className="highlight">{team.tipoDeporte}</span>
        </p>
        <p>
          Miembros: <span className="highlight">{membersInfo.length}</span>
        </p>

        <h3 className="section-title">Estadísticas</h3>
        <div className="container text-center">
          <div className="row row-cols-2">
            <div className="card-team">
              <div className="card-body">
                <p>
                  Distancia:{" "}
                  <span className="highlight">{team.distanciaClub}</span>
                </p>
              </div>
            </div>

            <div className="card-team">
              <div className="card-body">
                <p>
                  Tiempo: <span className="highlight">{team.tiempoEnRuta}</span>
                </p>
              </div>
            </div>
            <div className="card-team">
              <div className="card-body">
                <p>
                  Misiones:{" "}
                  <span className="highlight">
                    {team.misionesCompletadas} Completadas
                  </span>
                </p>
              </div>
            </div>
            <div className="card-team">
              <div className="card-body">
                <p>
                  Insignias: <span className="highlight">{team.insignias}</span>
                </p>
              </div>
            </div>
          </div>

          <h3 className="section-title">Miembros</h3>
          <ul>
            {membersInfo.map((user) => (
              <li key={user.uid}>{user.name}</li>
            ))}
          </ul>

          <h3 className="section-title">Logros y Medallas</h3>
          <div className="achievements">
            <img src={bici} alt="Medalla 1" />
            <img src={medalla} alt="Medalla 2" />
            <img src={objetivo} alt="Medalla 3" />
            <img src={equipo} alt="Medalla 4" />
          </div>
          <br />
          {/* Boton crear equipo */}

          <div className="container text-center">
            <div className="row row-cols-2">
              <button style={{}}>
                <Link to="/createTeam">Crear Equipo</Link>
              </button>
              <button style={{}}>
                <Link to="/joinTeam">Unirse a un Equipo</Link>
              </button>
            </div>
          </div>
          <br />
          <button
            type="button"
            className="btn btn-danger"
            data-bs-toggle="modal"
            data-bs-target="#staticBackdrop"
          >
            Abandonar Equipo
          </button>
        </div>

        <div
          className="modal fade"
          id="staticBackdrop"
          data-bs-backdrop="static"
          data-bs-keyboard="false"
          tabIndex="-1"
          aria-labelledby="staticBackdropLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="staticBackdropLabel">
                  Quieres abandonar al Equipo?
                </h1>{" "}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await handleLeaveTeam();
                    window.location.href = "/"; 
                  }}
                  type="button"
                  className="btn btn-danger"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  Abandonar Equipo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
