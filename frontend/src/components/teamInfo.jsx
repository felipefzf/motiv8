import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext'; // Para obtener el UID
import styles from './teamInfo.module.css'; // Crearemos este archivo CSS

function MyTeamInfo() {
  const { user, refreshUser } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveError, setLeaveError] = useState(null);

  useEffect(() => {
    const fetchMyTeam = async () => {
      if (!user) return; // Salir si no hay usuario

      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        setError("No autenticado.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/teams/my-team', { // Llama a la ruta /api
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 404) {
             throw new Error("Parece que no perteneces a ningún equipo.");
          }
          throw new Error(`Error del servidor: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTeamData(data);
        
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeam();
  }, [user]); // Ejecutar cuando 'user' cambie

  // --- Lógica para Salir del Equipo (Necesita Backend) ---
  const handleLeaveTeam = async () => {
    setLeaveError(null); 
    if (!teamData || !user) {
        setLeaveError("No se pueden cargar los datos del equipo o del usuario.");
        return;
    };

    // Confirmación con advertencia extra si es el dueño
    let confirmationMessage = `¿Estás seguro de que quieres salir de "${teamData.team_name}"?`;
    if (user.uid === teamData.owner_uid) {
      confirmationMessage = `¡Eres el dueño! Si sales, el equipo se eliminará permanentemente para todos. ¿Estás seguro?`;
    }

    if (!window.confirm(confirmationMessage)) {
      return; // El usuario canceló
    }

    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      setLeaveError("Error de autenticación.");
      return;
    }

    try {
      // Llama a la nueva ruta DELETE del backend
      const response = await fetch('/api/teams/leave', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Error al salir del equipo.');
      }

      // --- ¡Éxito! ---
      alert("Has salido del equipo.");
      
      // Llama a refreshUser() para que AuthContext
      // obtenga el estado 'team_member: false' desde el backend.
      refreshUser();

    } catch (err) {
      setLeaveError(err.message);
      console.error("Error leaving team:", err);
    }
  };

  // --- Render Logic ---
  if (loading) return <p className={styles.loading}>Loading your team info...</p>;
  // Show general fetch error first if it exists
  if (error) return <p className={styles.error}>{error}</p>;
  // If not loading and no team data (could happen after leaving or inconsistency)
  if (!teamData) return <p>You are not currently part of a team.</p>;

  return (
    <div className={styles.container}>
      <h2>Mi Equipo: <span className={styles.teamName}>{teamData.team_name}</span></h2>
      <p>Descripción: {teamData.description}</p>
      <p>Color: {teamData.team_color}</p>
      <h3>Miembros:</h3>
      
      <ul className={styles.memberList}>
        {teamData.members?.map(member => (
          <li key={member.uid} className={styles.memberItem}>
            <span className={styles.memberName}>{member.name}</span>
            <span className={styles.memberRole}> - ({member.role})</span> {/* <-- Muestra el rol */}
            
            {/* Muestra "(Tú)" si el UID coincide */}
            {member.uid === user.uid && <span className={styles.you}> (Tú)</span>}
          </li>
        ))}
        {/* --- FIN DEL BLOQUE --- */}

      </ul>
      
      <h3>Insignias y Logros:</h3>
      <br /><br /><br />


      <button onClick={handleLeaveTeam} className="btn-salirEquipo">
        Salir del Equipo
      </button>
    </div>
  );
}

export default MyTeamInfo;