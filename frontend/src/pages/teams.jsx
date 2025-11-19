import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import MyTeamInfo from "../components/teamInfo";
import JoinTeamView from "../components/joinTeam";
import CreateTeamForm from "../components/CreateTeamForm";
import styles from "./teams.module.css";

function Teams({ setTeamColor }) {
  const { user, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading) {
    return <p className={styles.loading}>Cargando...</p>;
  }

  if (!user) {
    return <p className={styles.error}>No estás autenticado.</p>;
  }

  const handleOpenCreate = () => setShowCreateModal(true);
  const handleCloseCreate = () => setShowCreateModal(false);

  const handleTeamCreated = (newTeam) => {
    if (newTeam?.team_color && setTeamColor) {
      setTeamColor(newTeam.team_color);
      localStorage.setItem("teamColor", newTeam.team_color);
      document.documentElement.style.setProperty(
        "--accent-color",
        newTeam.team_color
      );
      document.documentElement.style.setProperty(
        "--shadow-color",
        newTeam.team_color
      );
    }
    setShowCreateModal(false);
  };

  const isMember = user.team_member === true;

  return (
    <div className={styles.teamsContainer}>
      <h1 className={styles.teamsTitle}>MOTIV8</h1>
      <h2 className={styles.teamsSubtitle}>Equipos</h2>

      {isMember ? (
        <MyTeamInfo setTeamColor={setTeamColor} />
      ) : (
        <>
          <JoinTeamView setTeamColor={setTeamColor} />
          <div className={styles.createTeamWrapper}>
            <button
              type="button"
              className={styles.createTeamButton}
              onClick={handleOpenCreate}
            >
              + Crear nuevo equipo
            </button>
          </div>
        </>
      )}

      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <CreateTeamForm
              onClose={handleCloseCreate}
              onTeamCreated={handleTeamCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Teams;
