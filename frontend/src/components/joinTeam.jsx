import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/authContext";
import Modal from "./modal";
import CreateTeamForm from "./createTeamForm";
import TeamDetailModal from "./teamDetailModal";
import styles from "./JoinTeam.module.css";
import API_URL from "../config";
import LiveToast from "../components/liveToast";
import defaultTeamImage from "../assets/default-team-logo-500.png";

function JoinTeamView({ setTeamColor, showToast }) {
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
        const response = await fetch(`${API_URL}/api/teams/available`, {
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

  const checkEligibility = (team) => {
    const req = team.requirements || {};

    // 1. Si no hay requisitos (o el objeto está vacío), pase libre.
    if (!req || Object.keys(req).length === 0) return true;

    // 2. Si hay requisitos pero el usuario no tiene datos, rebota.
    if (!user?.performance) return false;

    const sport = team.sport_type ? team.sport_type.toLowerCase() : '';

    // === CASO RUNNING ===
    if (sport === 'running') {
      const myStats = user.performance.running || {};
      // Convertimos a número por seguridad
      const myPace = parseFloat(myStats.pace || 0);
      const myDist = parseFloat(myStats.distance || 0);

      // VALIDACIÓN RITMO (Menor es mejor)
      // Si el equipo pide 5.00 (req.pace) y yo tengo 6.00 (myPace) -> NO CUMPLO
      if (req.pace && req.pace > 0) {
        if (myPace === 0 || myPace > req.pace) return false;
      }

      // VALIDACIÓN DISTANCIA (Mayor es mejor)
      // Si el equipo pide 10km (req.distance) y yo corro 5km (myDist) -> NO CUMPLO
      if (req.distance && req.distance > 0) {
        if (myDist === 0 || myDist < req.distance) return false;
      }
    }

    // === CASO CYCLING ===
    if (sport === 'cycling' || sport === 'ciclismo') {
      const myStats = user.performance.cycling || {};
      const mySpeed = parseFloat(myStats.speed || 0);
      const myDist = parseFloat(myStats.distance || 0);

      // VALIDACIÓN VELOCIDAD (Mayor es mejor)
      // Si el equipo pide 30km/h (req.speed) y yo voy a 20km/h (mySpeed) -> NO CUMPLO
      if (req.speed && req.speed > 0) {
        if (mySpeed === 0 || mySpeed < req.speed) return false;
      }

      // VALIDACIÓN DISTANCIA (Mayor es mejor)
      if (req.distance && req.distance > 0) {
        if (myDist === 0 || myDist < req.distance) return false;
      }
    }

    return true; // Si pasa todas las pruebas, es apto.
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

      if (typeof showToast === "function") {
        showToast(`✅ Te has unido a "${data.team_name || teamName}"`);
      }


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
    if (typeof showToast === "function") {
      showToast(`🎉 Equipo "${newTeamData.team_name}" creado`);
    }


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

  if (loading)
    return <p className={styles.loading}>Buscando equipos disponibles...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container} ref={containerRef}>
      <div>
        <h2>Únete a un Equipo</h2>
        <span className={styles.teamsSubtitle}>
          Ser parte de un equipo deportivo te ayuda a motivarte, sentirte parte de una comunidad, y te permite unirte a otras personas con intereses similares. Busca el equipo que mejor se adapte a tus intereses y únete a él!
        </span>
        <br /><br />
        <div className={styles.headerRow}>
          <h3>¿No encuentras tu equipo?</h3>
          <button
            onClick={openCreateModal}
            className={`${styles.button} ${styles.createButton}`}
          >
            Crear Nuevo Equipo
          </button>
        </div>
      </div>
      {actionError && !selectedTeam && (
        <p className={styles.error}>{actionError}</p>
      )}

      {availableTeams.length === 0 ? (
        <p>No hay equipos disponibles para unirse.</p>
      ) : (
        <ul className={styles.teamList}>
          {availableTeams.map((team) => {

            // Calculamos si cumple para mostrar el aviso visual
            const isEligible = checkEligibility(team);

            return (
              <li
                key={team.id}
                className={styles.teamItemClickable}
                // 1. EL CLICK EN TODA LA TARJETA ABRE EL MODAL
                onClick={() => openDetailModal(team)}
              >
                <div className={styles.jointeam}>
                  <div className={styles.jointeambody}>
                    {/* Columna izquierda: imagen */}
                    <div className={styles.teamImageWrapper}>
                      {team.team_image_url ? (
                        <img
                          src={team.team_image_url}
                          alt={team.team_name}
                          className={styles.teamImage}
                        />
                      ) : (
                        <img
                          src={defaultTeamImage}
                          alt={team.team_name}
                          className={styles.teamImage}
                        />
                      )}
                    </div>

                    {/* Columna derecha: textos */}
                    <div className={styles.teamInfoRight}>
                      <div>
                        <span className={styles.teamName}>{team.team_name}</span>
                        <span className={styles.memberCount}>
                          ({team.member_count} Miembros)
                        </span>
                      </div>

                      {!isEligible && (
                        <div className={styles.requirementsBadgeError}>
                          ⛔ Requisitos no cumplidos
                        </div>
                      )}
                      {isEligible && (
                        <div className={styles.requirementsBadgeOk}>
                          ✅ Requisitos cumplidos
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. ¡SIN BOTONES AQUÍ! */}
              </li>
            );
          })}
        </ul>
      )}

      <hr className={styles.divider} />

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
        canJoin={selectedTeam ? checkEligibility(selectedTeam) : false}
      />

      {selectedTeam && actionError && (
        <p className={styles.modalError}>{actionError}</p>
      )}

    </div>
  );
}

export default JoinTeamView;
