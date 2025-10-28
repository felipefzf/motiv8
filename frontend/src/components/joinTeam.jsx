import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Para obtener el UID del usuario

function JoinTeamView() {
  const { user } = useAuth(); // Obtiene el usuario logueado
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinError, setJoinError] = useState(null); // Para errores al unirse

  useEffect(() => {
    // Función para obtener la lista de equipos disponibles
    const fetchAvailableTeams = async () => {
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        setError("No autenticado.");
        setLoading(false);
        return;
      }

      try {
        // --- LLAMADA A TU BACKEND ---
        // Necesitarás un endpoint como GET /api/teams/available
        // que devuelva los equipos a los que el usuario puede unirse
        const response = await fetch('/api/teams/available', {
           headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        setAvailableTeams(data); // Guarda la lista de equipos
        
      } catch (e) {
        setError("Error al cargar los equipos disponibles: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTeams();
  }, []);

  // Función para manejar el clic en "Unirse"
  const handleJoinTeam = async (teamId) => {
    setJoinError(null); // Limpia errores anteriores
    const token = localStorage.getItem('firebaseToken');
    if (!token || !user) {
      setJoinError("No autenticado.");
      return;
    }

    try {
      // --- LLAMADA A TU BACKEND ---
      // Necesitarás un endpoint como POST /api/teams/{teamId}/join
      // que use el token para añadir al usuario actual al equipo
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        // Podrías enviar el UID en el body si tu backend lo necesita,
        // pero es mejor obtenerlo del token en el backend.
        // body: JSON.stringify({ userId: user.uid }) 
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData || `Error al unirse al equipo: ${response.status}`);
      }
      
      // --- ¡ÉXITO! ---
      // Aquí viene la parte importante: ¿Cómo actualizas la vista?
      // Lo ideal es que tu AuthContext tenga una función para refrescar
      // los datos del usuario (y así user.teamMember se ponga a true).
      alert(`¡Te has unido al equipo ${teamId} con éxito! Refresca la página o implementa una actualización del estado.`);
      // Por ahora, podrías forzar un refresco (no ideal):
      // window.location.reload(); 
      // O llamar a una función del context:
      // refreshUserData(); // (Necesitarías añadir esta función a AuthContext)

    } catch (e) {
      setJoinError("Error al intentar unirse al equipo: " + e.message);
    }
  };


  // --- Renderizado ---
  if (loading) {
    return <p>Buscando equipos disponibles...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Únete a un Equipo</h2>
      
      {joinError && <p style={{ color: 'red' }}>{joinError}</p>}

      {availableTeams.length === 0 ? (
        <p>No hay equipos disponibles para unirse en este momento.</p>
      ) : (
        <ul>
          {availableTeams.map(team => (
            <li key={team.id} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <strong>{team.team_name}</strong>
              {/* Aquí podrías mostrar cuántos miembros tiene, etc. */}
              <button 
                onClick={() => handleJoinTeam(team.id)} 
                style={{ marginLeft: '15px', background: 'green', color: 'white' }}
              >
                Unirse
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr style={{margin: '30px 0'}} />

      {/* Opcional: Botón para crear un nuevo equipo */}
      <div>
        <h3>¿No encuentras tu equipo?</h3>
        <button style={{background: 'blue', color: 'white'}}>Crear un Nuevo Equipo</button>
        {/* Este botón debería abrir un formulario o redirigir a una página de creación */}
      </div>
    </div>
  );
}

export default JoinTeamView;