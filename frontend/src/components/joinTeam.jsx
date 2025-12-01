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

   
    if (!req || Object.keys(req).length === 0) return true;

   
    if (!user?.performance) return false;

    const sport = team.sport_type ? team.sport_type.toLowerCase() : '';

    // === CASO RUNNING ===
    if (sport === 'running') {
      const myStats = user.performance.running || {};
      
      const myPace = parseFloat(myStats.pace || 0);
      const myDist = parseFloat(myStats.distance || 0);

     
      if (req.pace && req.pace > 0) {
        if (myPace === 0 || myPace > req.pace) return false;
      }

      
      if (req.distance && req.distance > 0) {
        if (myDist === 0 || myDist < req.distance) return false;
      }
    }

    // === CASO CYCLING ===
    if (sport === 'cycling' || sport === 'ciclismo') {
      const myStats = user.performance.cycling || {};
      const mySpeed = parseFloat(myStats.speed || 0);
      const myDist = parseFloat(myStats.distance || 0);

      // VALIDACIÓN VELOCIDAD
      if (req.speed && req.speed > 0) {
        if (mySpeed === 0 || mySpeed < req.speed) return false;
      }

    
      if (req.distance && req.distance > 0) {
        if (myDist === 0 || myDist < req.distance) return false;
      }
    }

    return true; 
  };


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

   
      const data = await response.json();

    
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


  const handleTeamCreated = (newTeamData) => {
    if (typeof showToast === "function") {
      showToast(`🎉 Equipo "${newTeamData.team_name}" creado`);
    }



    if (newTeamData.team_color) {
      applyTeamColor(newTeamData.team_color);
    }


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

       
            const isEligible = checkEligibility(team);

            return (
              <li
                key={team.id}
                className={styles.teamItemClickable}
         
                onClick={() => openDetailModal(team)}
              >
                <div className={styles.jointeam}>
                  <div className={styles.jointeambody}>
    
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

       
              </li>
            );
          })}
        </ul>
      )}

      <hr className={styles.divider} />


      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateTeamForm
          onClose={closeCreateModal}
          onTeamCreated={handleTeamCreated}
        />
      </Modal>

   
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
