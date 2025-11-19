import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/authContext";
import Modal from "./modal";
import CreateTeamForm from "./createTeamForm";
import TeamDetailModal from "./teamDetailModal";
import styles from "./JoinTeam.module.css";

function JoinTeamView({ setTeamColor }) {
  const { user, refreshUser, updateUserTeamStatus } = useAuth();
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const containerRef = useRef(null);

  // 🔁 cargar equipos disponibles
  useEffect(() => {
    const fetchAvailableTeams = async () => {
      const token = localStorage.getItem("firebaseToken");
      if (!token) {
        setError("No autenticado.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/teams/available", {
          headers: { Authorization: `Bearer ${token}` },
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

  // 🎨 helper para aplicar color de equipo globalmente
  const applyTeamColor = (color) => {
    if (!color) return;

    localStorage.setItem("teamColor", color);
    if (typeof setTeamColor === "function") {
      setTeamColor(color);
    }

    document.documentElement.style.setProperty("--accent-color", color);
    document.documentElement.style.setProperty("--shadow-color", color);
  };

  // 👉 unirse a un equipo
  const handleJoinTeam = async (teamId, teamName) => {
    setActionError(null);
    const token = localStorage.getItem("firebaseToken");
    if (!token || !user) {
      setActionError("No autenticado.");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData || `Error al unirse al equipo.`);
      }

      // ⬇️ asumo que el backend devuelve los datos del equipo
      const data = await response.json();

      // 🎨 aplicar color del equipo
      if (data.team_color) {
        applyTeamColor(data.team_color);
      }

      alert(`¡Te has unido a "${data.team_name || teamName}"!`);
      closeDetailModal();
      refreshUser();
    } catch (e) {
      setActionError("Error al unirse: " + e.message);
    }
  };

  // --- Modal Handlers ---
  const openCreateModal = () => {
    setIsCreateModalOpen(true);

    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  // 👉 al crear un equipo desde el modal
  const handleTeamCreated = (newTeamData) => {
    alert(`Equipo "${newTeamData.team_name}" creado.`);

    // 🎨 si el backend envía el color, lo aplicamos
    if (newTeamData.team_color) {
      applyTeamColor(newTeamData.team_color);
    }

    // si tu backend devuelve un id o algo similar:
    if (updateUserTeamStatus && newTeamData.teamId) {
      updateUserTeamStatus(newTeamData.teamId);
    }

    closeCreateModal();
    refreshUser?.();
  };

  // --- Detail Modal Handlers ---
  const openDetailModal = (team) => {
    setSelectedTeam(team);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTeam(null);
  };

  if (loading) return <p className={styles.loading}>Buscando equipos disponibles...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container} ref={containerRef}>
      <h2>Únete a un Equipo</h2>

      {actionError && !selectedTeam && (
        <p className={styles.error}>{actionError}</p>
      )}

      {availableTeams.length === 0 ? (
        <p>No hay equipos disponibles para unirse.</p>
      ) : (
        <ul className={styles.teamList}>
          {availableTeams.map((team) => (
            <li
              key={team.id}
              className={styles.teamItemClickable}
              onClick={() => openDetailModal(team)}
            >
              <div className={styles.jointeam}>
                <div className={styles.jointeambody}>
                  <span className={styles.teamName}>{team.team_name}</span>
                  <span className={styles.memberCount}>
                    ({team.member_count} miembro/s)
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <hr className={styles.divider} />

      <div>
        <h3>¿No encuentras tu equipo?</h3>
        <button
          onClick={openCreateModal}
          className={`${styles.button} ${styles.createButton}`}
        >
          Crear Nuevo Equipo
        </button>
      </div>

      {/* Modal crear equipo */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateTeamForm
          onClose={closeCreateModal}
          onTeamCreated={handleTeamCreated}
        />
      </Modal>

      {/* Modal detalle equipo + botón unirse */}
      <TeamDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        onJoin={handleJoinTeam}
        team={selectedTeam}
      />

      {selectedTeam && actionError && (
        <p className={styles.modalError}>{actionError}</p>
      )}
    </div>
  );
}

export default JoinTeamView;
