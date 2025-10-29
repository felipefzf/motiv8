import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import Modal from './modal'; // <-- 1. Import Modal
import CreateTeamForm from './createTeamForm'; // <-- 2. Import CreateTeamForm
import styles from './JoinTeam.module.css';

function JoinTeamView() {
  const { user, refreshUser } = useAuth();
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // <-- 3. State for modal

  // ... (useEffect for fetchAvailableTeams remains the same) ...
  useEffect(() => {
    // ... fetchAvailableTeams logic ...
    const fetchAvailableTeams = async () => {
        const token = localStorage.getItem('firebaseToken');
        if (!token) {
          setError("No autenticado.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response = await fetch('/api/teams/available', {
             headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
          }

          const data = await response.json();
          setAvailableTeams(data);

        } catch (e) {
          setError("Error al cargar equipos: " + e.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAvailableTeams();
  }, []);

  // ... (handleJoinTeam remains the same) ...
    const handleJoinTeam = async (teamId, teamName) => {
    setActionError(null);
    const token = localStorage.getItem('firebaseToken');
    if (!token || !user) {
      setActionError("No autenticado.");
      return;
    }

    if (!window.confirm(`¿Seguro que quieres unirte a "${teamName}"?`)) {
        return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData || `Error al unirse al equipo.`);
      }

      alert(`¡Te has unido a "${teamName}"!`);
      // Ideal: refresh user data in AuthContext instead of reload
      refreshUser();

    } catch (e) {
      setActionError("Error al unirse: " + e.message);
    }
  };

  // --- 4. Functions to handle the modal ---
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Callback when a team is successfully created
  const handleTeamCreated = (newTeamData) => {
    // We need to refresh the user's data to update `user.team_member` to true
    // Simplest (but not ideal) way is to reload the page
     alert(`Equipo "${newTeamData.team_name}" creado. Refrescando...`);
     refreshUser();
     // A better way would be to call a function from AuthContext to refetch user data
     // e.g., refreshUser();
  };


  if (loading) return <p className={styles.loading}>Buscando equipos disponibles...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h2>Únete a un Equipo</h2>

      {actionError && <p className={styles.error}>{actionError}</p>}

      {/* ... (List of available teams remains the same) ... */}
            {availableTeams.length === 0 ? (
        <p>No hay equipos disponibles para unirse en este momento.</p>
      ) : (
        <ul className={styles.teamList}>
          {availableTeams.map(team => (
            <li key={team.id} className={styles.teamItem}>
              <span className={styles.teamName}>{team.team_name}</span>
              <span className={styles.memberCount}>({team.member_count} miembro/s)</span>
              <button
                onClick={() => handleJoinTeam(team.id, team.team_name)}
                className={`${styles.button} ${styles.joinButton}`}
              >
                Unirse
              </button>
            </li>
          ))}
        </ul>
      )}


      <hr className={styles.divider} />

      <div>
        <h3>¿No encuentras tu equipo?</h3>
        {/* --- 5. Button now opens the modal --- */}
        <button onClick={openCreateModal} className={`${styles.button} ${styles.createButton}`}>
          Crear Nuevo Equipo
        </button>
      </div>

      {/* --- 6. Render the Modal conditionally --- */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateTeamForm onClose={closeCreateModal} onTeamCreated={handleTeamCreated} />
      </Modal>
    </div>
  );
}

export default JoinTeamView;