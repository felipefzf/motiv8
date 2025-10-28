import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import './Teams.css';
import { Link } from 'react-router-dom';


export default function JoinTeam() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningTeamId, setJoiningTeamId] = useState(null);

  const fetchTeams = async () => {
      try {
        const response = await axios.get('http://localhost:5000/teams');
        setTeams(response.data);
      } catch (error) {
        console.error('Error al obtener equipos:', error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleJoin = async (teamId) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Debes iniciar sesión para unirte a un equipo.');
      return;
    }

    setJoiningTeamId(teamId);

    try {
      await axios.post(`http://localhost:5000/teams/${teamId}/join`, {
        uid: user.uid
      });

      alert('Te has unido al equipo con éxito.');
      await fetchTeams();
      window.location.href = "/";
    } catch (error) {
      console.error('Error al unirse al equipo:', error);
      alert(error.response?.data?.error || 'Error al unirse al equipo.');
    } finally {
      setJoiningTeamId(null);
    }
  };

  return (
    <div className="container mt-5">
      <div className="container text-center">
            <div className="row row-cols-2">
              <button
                style={{
                }}
              >
                <Link to="/createTeam">
                  Crear Equipo
                </Link>
              </button>
            </div>
          </div>
      <h2>Unirse a un equipo</h2>
      {loading ? (
        <p>Cargando equipos...</p>
      ) : teams.length === 0 ? (
        <p>No hay equipos disponibles.</p>
      ) : (
        <div>
          {teams.map((team) => (
            <div key={team.id}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{team.nombreEquipo}</h5>
                  <p><strong>Deporte:</strong> {team.tipoDeporte}</p>
                  <p><strong>Descripción:</strong> {team.descripcion}</p>
                  <p><strong>Miembros:</strong> {team.miembros?.length || 1}</p>
                  <button
                    className="btn btn-success"
                    onClick={() => handleJoin(team.id)}
                    disabled={joiningTeamId === team.id}
                  >
                    {joiningTeamId === team.id ? 'Uniéndote...' : 'Unirse'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}