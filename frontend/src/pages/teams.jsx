import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import MyTeamInfo from "../components/teamInfo";
import JoinTeamView from "../components/joinTeam";
import CreateTeamForm from "../components/createTeamForm";
import styles from "./teams.module.css";
import LiveToast from "../components/liveToast";
import API_URL from "../config"; // (Ajusta la ruta de importación)
import Header from "../components/Header"; // 👈 IMPORTA EL HEADER

function Teams({ setTeamColor }) {
  const { user, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((prev) => prev + 1);
  };

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
    <div className={styles.teamsPageWithHeader}>
      {/* 🔹 HEADER FIJO ARRIBA */}
      <Header title="Equipos" />

      {/* 🔹 CONTENIDO DE EQUIPOS DEBAJO DEL HEADER */}
      <div className={styles.teamsContainer}>
        {/* Ya no necesitamos el h1/h2 con MOTIV8 / Equipos */}
        {isMember ? (
          <MyTeamInfo setTeamColor={setTeamColor} />
        ) : (
          <JoinTeamView setTeamColor={setTeamColor} />
        )}

        {showCreateModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <CreateTeamForm
                onClose={handleCloseCreate}
                onTeamCreated={handleTeamCreated}
                showToast={showToast}
              />
            </div>
          </div>
        )}

        {toastMessage && <LiveToast key={toastKey} message={toastMessage} />}
      </div>
    </div>
  );
}

export default Teams;
