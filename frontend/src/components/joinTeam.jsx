import React, { useState, useEffect, useRef } from 'react'; // 🟡 agrega useRef
import { useAuth } from '../context/authContext';
import Modal from './modal';
import CreateTeamForm from './createTeamForm';
import TeamDetailModal from './teamDetailModal';
import styles from './JoinTeam.module.css';

function JoinTeamView() {
  const { user, refreshUser, updateUserTeamStatus } = useAuth();
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  const containerRef = useRef(null); // 🟡 referencia al contenedor principal

  useEffect(() => {
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

  const handleJoinTeam = async (teamId, teamName) => {
    setActionError(null);
    const token = localStorage.getItem('firebaseToken');
    if (!token || !user) {
      setActionError("No autenticado.");
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
      closeDetailModal();
      refreshUser();

    } catch (e) {
      setActionError("Error al unirse: " + e.message);
    }
  };

  // --- Modal Handlers ---
  const openCreateModal = () => {
    setIsCreateModalOpen(true);

    // 🟡 Sube el scroll al inicio del contenedor
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleTeamCreated = (newTeamData) => {
    alert(`Equipo "${newTeamData.team_name}" creado.`);
    updateUserTeamStatus(newTeamData.teamId);
    closeCreateModal();
  };

  // --- Detail Modal Handlers ---
  const openDetailModal = (team) => {
    setActionError(null);
    setSelectedTeam(team);
  };
  const closeDetailModal = () => {
    setSelectedTeam(null);
    setActionError(null);
  };

  if (loading) return <p className={styles.loading}>Buscando equipos disponibles...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    // 🟡 Asigna el ref al contenedor principal
    <div className={styles.container} ref={containerRef}>
      <h2>Únete a un Equipo</h2>

      {actionError && !selectedTeam && <p className={styles.error}>{actionError}</p>}

      {availableTeams.length === 0 ? (
        <p>No hay equipos disponibles para unirse.</p>
      ) : (
        <ul className={styles.teamList}>
          {availableTeams.map(team => (
            <li
              key={team.id}
              className={styles.teamItemClickable}
              onClick={() => openDetailModal(team)}
            >
              <div className={styles.jointeam}>
                <div className={styles.jointeambody}>
                  <span className={styles.teamName}>{team.team_name}</span>
                  <span className={styles.memberCount}>({team.member_count} miembro/s)</span>
                </div>
              </div>
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

      {/* Modales */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateTeamForm onClose={closeCreateModal} onTeamCreated={handleTeamCreated} />
      </Modal>

      <TeamDetailModal
        team={selectedTeam}
        onClose={closeDetailModal}
        onJoin={handleJoinTeam}
      />

      {selectedTeam && actionError && <p className={styles.modalError}>{actionError}</p>}
    </div>
  );
}

export default JoinTeamView;
