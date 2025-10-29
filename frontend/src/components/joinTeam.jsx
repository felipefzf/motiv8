import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import Modal from './modal';
import CreateTeamForm from './createTeamForm';
import TeamDetailModal from './teamDetailModal'; // <-- 1. Import Detail Modal
import styles from './JoinTeam.module.css';

function JoinTeamView() {
  const { user, refreshUser } = useAuth();
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); // <-- 2. State for detail view

  useEffect(() => {
    // ... fetchAvailableTeams logic remains the same ...
    // Make sure it fetches description and members now
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
          setAvailableTeams(data); // Includes description and members now

        } catch (e) {
          setError("Error al cargar equipos: " + e.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAvailableTeams();
  }, []);

  const handleJoinTeam = async (teamId, teamName) => {
    // ... handleJoinTeam logic remains the same ...
        setActionError(null);
    const token = localStorage.getItem('firebaseToken');
    if (!token || !user) {
      setActionError("No autenticado.");
      return;
    }

    // Confirmation now happens inside the detail modal or before opening it
    // if (!window.confirm(`¿Seguro que quieres unirte a "${teamName}"?`)) {
    //     return;
    // }

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
      closeDetailModal(); // Close detail modal on success
      refreshUser();

    } catch (e) {
      // Show error inside the detail modal if it's open
      setActionError("Error al unirse: " + e.message);
      // Or set it generally if needed
      // setError("Error al unirse: " + e.message);
    }
  };

  // --- Modal Handlers ---
  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);
  const handleTeamCreated = (newTeamData) => {
     alert(`Equipo "${newTeamData.team_name}" creado.`);
     refreshUser();
     closeCreateModal();
  };

  // --- Detail Modal Handlers ---
  const openDetailModal = (team) => {
      setActionError(null); // Clear previous errors when opening a new detail
      setSelectedTeam(team);
  };
  const closeDetailModal = () => {
      setSelectedTeam(null);
      setActionError(null); // Clear error on close
  };


  if (loading) return <p className={styles.loading}>Buscando equipos disponibles...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h2>Únete a un Equipo</h2>

      {actionError && !selectedTeam && <p className={styles.error}>{actionError}</p>}

      {availableTeams.length === 0 ? (
        <p>No hay equipos disponibles para unirse.</p>
      ) : (
        <ul className={styles.teamList}>
          {availableTeams.map(team => (
            // --- 3. Make the LI clickable ---
            <li
                key={team.id}
                className={styles.teamItemClickable} // Use a new style for clickable item
                onClick={() => openDetailModal(team)} // Open detail modal on click
            >
              <div> {/* Wrap text content */}
                <span className={styles.teamName}>{team.team_name}</span>
                <span className={styles.memberCount}>({team.member_count} miembro/s)</span>
              </div>
              {/* Optional: Add a small visual indicator like an arrow */}
              <span>&rarr;</span>
              {/* --- 4. Remove the join button here ---
               <button
                 onClick={(e) => { e.stopPropagation(); handleJoinTeam(team.id, team.team_name); }} // Stop propagation needed if button is inside LI
                 className={`${styles.button} ${styles.joinButton}`}
               >
                 Unirse
               </button>
              */}
            </li>
          ))}
        </ul>
      )}

      <hr className={styles.divider} />

      <div>
        <h3>¿No encuentras tu equipo?</h3>
        <button onClick={openCreateModal} className={`${styles.button} ${styles.createButton}`}>
          Crear Nuevo Equipo
        </button>
      </div>

      {/* --- Render Modals --- */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateTeamForm onClose={closeCreateModal} onTeamCreated={handleTeamCreated} />
      </Modal>

      {/* --- 5. Render Detail Modal --- */}
      <TeamDetailModal
        team={selectedTeam}
        onClose={closeDetailModal}
        onJoin={handleJoinTeam} // Pass the join handler
      />
      {/* Show join error inside the detail modal */}
       {selectedTeam && actionError && <p className={styles.modalError}>{actionError}</p>}


    </div>
  );
}

export default JoinTeamView;