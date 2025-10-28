import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Para obtener el UID del usuario

function MyTeamInfo() {
  const { user } = useAuth(); // Obtiene el usuario logueado
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Función para obtener los datos del equipo del usuario
    const fetchMyTeam = async () => {
      if (!user) return; // Si no hay usuario, no hacer nada

      const token = localStorage.getItem('firebaseToken'); // Necesario para la API
      if (!token) {
        setError("No autenticado.");
        setLoading(false);
        return;
      }

      try {
        // --- LLAMADA A TU BACKEND ---
        // Necesitarás un endpoint como GET /api/teams/my-team
        // que use el token para encontrar el equipo del usuario
        const response = await fetch('/api/teams/my-team', { 
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 404) {
             throw new Error("No se encontró información de tu equipo. ¿Aún eres miembro?");
          }
          throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        setTeamData(data); // Guarda los datos del equipo (nombre, miembros, etc.)
        
      } catch (e) {
        setError("Error al cargar la información del equipo: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeam();
  }, [user]); // Vuelve a ejecutar si el usuario cambia

  // --- Renderizado ---
  if (loading) {
    return <p>Cargando información de tu equipo...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!teamData) {
    return <p>No se encontró información del equipo.</p>;
  }

  return (
    <div>
      <h2>Mi Equipo: {teamData.team_name}</h2>
      {/* Muestra aquí más detalles del equipo */}
      <p>ID del Equipo: {teamData.id}</p>
      
      <h3>Miembros:</h3>
      <ul>
        {/* Asumiendo que teamData.members es un array de UIDs
            Necesitarás hacer otra llamada o modificar tu backend
            para obtener los nombres de los miembros a partir de los UIDs.
            Por ahora, solo mostramos los UIDs:
        */}
        {teamData.members && teamData.members.map(memberId => (
          <li key={memberId}>
            {memberId} {memberId === user.uid ? '(Tú)' : ''} 
            {/* Aquí podrías mostrar el nombre si lo tienes */}
          </li>
        ))}
      </ul>

      {/* Aquí podrías añadir un botón para "Salir del Equipo" */}
      <button style={{marginTop: '20px', background: 'red', color: 'white'}}>Salir del Equipo</button>
    </div>
  );
}

export default MyTeamInfo;