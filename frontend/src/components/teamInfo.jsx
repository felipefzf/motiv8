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
    setLeaveError(null); // Clear previous leave errors
    if (!teamData || !user) {
        setLeaveError("Cannot leave team: User or team data missing.");
        return;
    };

    // Confirmation dialog, with extra warning for the owner
    let confirmationMessage = `Are you sure you want to leave "${teamData.team_name}"?`;
    if (user.uid === teamData.owner_uid) {
      confirmationMessage = `You are the owner of "${teamData.team_name}". If you leave, the team will be permanently deleted for everyone! Are you absolutely sure?`;
    }

    if (!window.confirm(confirmationMessage)) {
      return; // Stop if the user cancels
    }

    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      setLeaveError("Authentication error. Please log in again.");
      return;
    }

    try {
      // Make the DELETE request to the backend endpoint
      const response = await fetch('/api/teams/leave', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Get error message from backend response
        const errText = await response.text();
        throw new Error(errText || 'Failed to leave the team.');
      }

      // --- Success ---
      alert("You have successfully left the team.");
      // Call refreshUser from the AuthContext to update the user's state
      // This will trigger a re-render in Teams.jsx and show JoinTeamView
      refreshUser();

    } catch (err) {
      setLeaveError(err.message); // Show error to the user
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
          <li key={member.uid}>
            {/* {member.uid} {member.uid === user.uid ? <span className={styles.you}>(Tú)</span> : ''} */}
            {/* Para mostrar nombres, necesitarías obtenerlos */}
            <li key={member.uid}>{member.name}</li>
          </li>
        ))}
      </ul><br />
      
      <h3>Insignias y Logros:</h3>
      <br /><br /><br />


      <button onClick={handleLeaveTeam} className={styles.leavebutton}>
        Salir del Equipo
      </button>
    </div>
  );
}

export default MyTeamInfo;