import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import styles from "./teamInfo.module.css";
import LiveToast from "../components/liveToast";
import Modal from "../components/modal.jsx";

function MyTeamInfo({ setTeamColor }) {
  const { user, refreshUser } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveError, setLeaveError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  

  const resetAccentToDefault = () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "dark";

    if (currentTheme === "light") {
      document.documentElement.style.setProperty("--accent-color", "#0066cc");
      document.documentElement.style.setProperty("--shadow-color", "#0066cc");
    } else {
      document.documentElement.style.setProperty("--accent-color", "#ffd000ff");
      document.documentElement.style.setProperty("--shadow-color", "#ffd000ff");
    }
  };

  useEffect(() => {
    const fetchMyTeam = async () => {
      if (!user) return;

      const token = localStorage.getItem("firebaseToken");
      if (!token) {
        setError("No autenticado.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/teams/my-team", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            localStorage.removeItem("teamColor");
            if (typeof setTeamColor === "function") {
              setTeamColor("");
            }
            resetAccentToDefault();
            throw new Error("Parece que no perteneces a ningún equipo.");
          }
          throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        setTeamData(data);

        if (data.team_color && typeof setTeamColor === "function") {
          setTeamColor(data.team_color);
          localStorage.setItem("teamColor", data.team_color);
          document.documentElement.style.setProperty(
            "--accent-color",
            data.team_color
          );
          document.documentElement.style.setProperty(
            "--shadow-color",
            data.team_color
          );
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeam();
  }, [user, setTeamColor]);

  const handleLeaveTeam = async () => {
    setLeaveError(null);
    if (!teamData || !user) {
      setLeaveError("No se pueden cargar los datos del equipo o del usuario.");
      return;
    }

    
    setShowConfirmModal(true);
    const token = localStorage.getItem("firebaseToken");
    if (!token) {
      setLeaveError("Error de autenticación.");
      return;
    }

    try {
      const response = await fetch("/api/teams/leave", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error al salir del equipo.");
      }

      setToastMessage("🚪 Has salido del equipo.");
      setToastKey((prev) => prev + 1);
      ("Has salido del equipo.");

      localStorage.removeItem("teamColor");
      if (typeof setTeamColor === "function") {
        setTeamColor("");
      }
      resetAccentToDefault();

      setTeamData(null);
      refreshUser();
    } catch (err) {
      setLeaveError(err.message);
      console.error("Error leaving team:", err);
    }
  };

  if (loading)
    return <p className={styles.loading}>Loading your team info...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!teamData) return <p>You are not currently part of a team.</p>;

  return (
  <div className={styles.container}>
    {teamData.team_image_url && (
      <img
        className={styles.teamLogo}
        src={teamData.team_image_url}
        alt={`Logo de ${teamData.team_name}`}
      />
    )}
    <h2>
      <span className={styles.teamName}>{teamData.team_name}</span>
    </h2>
    <p>Descripción: {teamData.description}</p>
    <p>Color: {teamData.team_color}</p>

    <h3>Miembros:</h3>
    <ul className={styles.memberList}>
      {teamData.members?.map((member) => (
        <li key={member.uid} className={styles.memberItem}>
          <span className={styles.memberName}>{member.name}</span>
          <span className={styles.memberRole}> - ({member.role})</span>
          {member.uid === user.uid && (
            <span className={styles.you}> (Tú)</span>
          )}
        </li>
      ))}
    </ul>

    <h3>Insignias y Logros:</h3>
    <br />
    <br />
    <br />

    {leaveError && <p className={styles.error}>{leaveError}</p>}

    <button
      onClick={() => {
        
        setShowConfirmModal(true);
      }}
      className="btn-salirEquipo"
    >
      Salir del Equipo
    </button>

    {/* ✅ Modal de confirmación */}
    {showConfirmModal && (
      <Modal
        isOpen={true}
        onClose={() => setShowConfirmModal(false)}
      >
        <div className={styles.confirmBox}>
          <p>
            {user.uid === teamData.owner_uid
              ? "⚠️ Eres el dueño. Si sales, el equipo se eliminará permanentemente para todos. ¿Estás seguro?"
              : `¿Estás seguro de que quieres salir de "${teamData.team_name}"?`}
          </p>
          <div className={styles.confirmButtons}>
            <button
              className="btn btn-danger"
              onClick={() => {
                setShowConfirmModal(false);
                handleLeaveTeam(); // ✅ ejecuta salida
              }}
            >
              Aceptar
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    )}

    {/* ✅ Toast global */}
    {toastMessage && <LiveToast key={toastKey} message={toastMessage} />}
  </div>
);

}

export default MyTeamInfo;
