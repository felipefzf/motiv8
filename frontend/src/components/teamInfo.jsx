import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import styles from "./teamInfo.module.css";
import LiveToast from "../components/liveToast";
import Modal from "../components/modal.jsx";
import API_URL from "../config";
import EditTeamForm from "./editTeamModal.jsx";
import DefaultTeamLogo from "../assets/default-team-logo-500.png";
import TeamEventsModal from "./teamEventsModal.jsx";

function MyTeamInfo({ setTeamColor }) {
  const { user, refreshUser } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveError, setLeaveError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);

  const [memberToEdit, setMemberToEdit] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estado para usar o no el color del equipo
  const [useTeamColor, setUseTeamColor] = useState(() => {
    const stored = localStorage.getItem("useTeamColor");
    return stored === "true";
  });

  const resetAccentToDefault = () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "dark";

    if (currentTheme === "light") {
      document.documentElement.style.setProperty("--accent-color", "#0066cc");
      document.documentElement.style.setProperty("--shadow-color", "#0066cc");
    } else {
      document.documentElement.style.setProperty(
        "--accent-color",
        "#ffd000ff"
      );
      document.documentElement.style.setProperty(
        "--shadow-color",
        "#ffd000ff"
      );
    }
  };

  const applyTeamColor = (color) => {
    document.documentElement.style.setProperty("--accent-color", color);
    document.documentElement.style.setProperty("--shadow-color", color);
  };

  const toggleUseTeamColor = () => {
    const newValue = !useTeamColor;
    setUseTeamColor(newValue);
    localStorage.setItem("useTeamColor", newValue);

    if (newValue && teamData?.team_color) {
      // Activar color del equipo
      applyTeamColor(teamData.team_color);
      if (typeof setTeamColor === "function") setTeamColor(teamData.team_color);
      localStorage.setItem("teamColor", teamData.team_color);
    } else {
      // Desactivar color del equipo
      resetAccentToDefault();
      if (typeof setTeamColor === "function") setTeamColor("");
      localStorage.removeItem("teamColor");
    }
  };

  const openRoleEditor = (member) => {
    setMemberToEdit(member);
    setNewRole(member.team_role || "Miembro");
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!memberToEdit || !newRole) return;
    const token = localStorage.getItem("firebaseToken");

    try {
      const response = await fetch(
        `/api/teams/${teamData.id}/members/${memberToEdit.uid}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newRole }),
        }
      );

      if (!response.ok) throw new Error(await response.text());

      alert(`Rol de ${memberToEdit.name} actualizado a ${newRole}`);
      setIsRoleModalOpen(false);
      window.location.reload();
    } catch (error) {
      alert(error.message);
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
        const response = await fetch(`${API_URL}/api/teams/my-team`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            localStorage.removeItem("teamColor");
            localStorage.setItem("useTeamColor", "false");
            if (typeof setTeamColor === "function") setTeamColor("");
            resetAccentToDefault();
            throw new Error("Parece que no perteneces a ningún equipo.");
          }
          throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        setTeamData(data);

        if (data.team_color && useTeamColor) {
          applyTeamColor(data.team_color);
          if (typeof setTeamColor === "function") setTeamColor(data.team_color);
          localStorage.setItem("teamColor", data.team_color);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeam();
  }, [user, setTeamColor, useTeamColor]);

  const handleTeamUpdated = () => {
    window.location.reload();
  };

  const handleLeaveTeam = async () => {
    setLeaveError(null);
    if (!teamData || !user) {
      setLeaveError("No se pueden cargar los datos del equipo o del usuario.");
      return;
    }

    const token = localStorage.getItem("firebaseToken");
    if (!token) {
      setLeaveError("Error de autenticación.");
      return;
    }

    try {
      const response = await fetch("/api/teams/leave", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error al salir del equipo.");
      }

      setToastMessage("🚪 Has salido del equipo.");
      setToastKey((prev) => prev + 1);

      localStorage.removeItem("teamColor");
      localStorage.setItem("useTeamColor", "false");
      if (typeof setTeamColor === "function") setTeamColor("");
      resetAccentToDefault();

      setTeamData(null);
      refreshUser();
    } catch (err) {
      setLeaveError(err.message);
      console.error("Error leaving team:", err);
    }
  };

  if (loading) return <p className={styles.loading}>Cargando la información del equipo...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!teamData) return <p>No pertences.</p>;

  const isOwner = user?.uid === teamData.owner_uid;
  const myMemberData = teamData.members?.find((m) => m.uid === user.uid);
  const myRole = myMemberData ? myMemberData.role : "";
  const canCreateEvents =
    isOwner || myRole === "Comandante" || myRole === "Veterano";

  const val = (value, unit) => (value ? `${value} ${unit}` : "--");

  return (
    <div className={styles.container}>
      {/* HEADER: logo + nombre + botones */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          {teamData.team_image_url ? (
            <img
              className={styles.teamLogo}
              src={teamData.team_image_url}
              alt={`Logo de ${teamData.team_name}`}
            />
          ) : (
            <img
              className={styles.teamLogoDefault}
              src={DefaultTeamLogo}
              alt="Logo por defecto"
            />
          )}
        </div>

        <div className={styles.headerRight}>
          <h2 className={styles.teamName}>{teamData.team_name}</h2>

          {isOwner && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className={styles.editButton}
            >
              Editar Equipo
            </button>
          )}

          <button
            onClick={() => setIsEventsModalOpen(true)}
            className={`${styles.button} ${styles.eventsButton}`}
          >
            Eventos del Equipo
          </button>
        </div>
      </div>
      {/* DESCRIPCIÓN */}
      <div className={styles.descriptionSection}>
        <p>{teamData.description}</p>
      </div>
      <br />

      {/* CARD REQUERIMIENTOS */}
      <div className={styles.requirementsCard}>
        {teamData.sport_type === "running" && (
          <div className="card-body performance-card-body">
            <h5 className="performance-card-title">
              Requerimientos - Running
            </h5>
            <p>
              Ritmo:{" "}
              <span className="highlight">
                {val(teamData.requirements?.pace, "min/km")}
              </span>
            </p>
            <p>
              Distancia:{" "}
              <span className="highlight">
                {val(teamData.requirements?.distance, "km")}
              </span>
            </p>
          </div>
        )}

        {teamData.sport_type === "cycling" && (
          <div className="card-body performance-card-body">
            <h5 className="performance-card-title">
              Requerimientos - Ciclismo
            </h5>
            <p>
              Velocidad:{" "}
              <span className="highlight">
                {val(teamData.requirements?.speed, "km/h")}
              </span>
            </p>
            <p>
              Distancia:{" "}
              <span className="highlight">
                {val(teamData.requirements?.distance, "km")}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* SECCIÓN COLOR DEL EQUIPO */}
      <div className={styles.colorSection}>
        <div
          className={styles.colorBadge}
          style={{ backgroundColor: teamData.team_color }}
        >
          <span className={styles.colorBadgeText}>Color del equipo</span>
        </div>

        <button
          onClick={toggleUseTeamColor}
          className={styles.btnOcuparColor}
        >
          {useTeamColor
            ? "Desactivar color del equipo"
            : "Usar color del equipo como tema"}
        </button>
      </div>

      

      {/* LISTA DE MIEMBROS */}
      <h3 className={styles.membersTitle}>Miembros del equipo</h3>
      <ul className={styles.memberList}>
        {teamData.members?.map((member) => (
          <li key={member.uid} className={styles.memberItem}>
            <div className={styles.memberChip}>
              <div className={styles.memberMainRow}>
                <span className={styles.memberName}>
                  {member.name}
                  {member.role === "Líder" && (
                    <span
                      className={styles.crown}
                      aria-label="Líder"
                      title="Líder"
                    >
                      👑
                    </span>
                  )}
                </span>

                {isOwner && member.uid !== user.uid && (
                  <button
                    onClick={() => openRoleEditor(member)}
                    className={styles.memberYouBadge}
                    title="Editar Rol"
                  >
                    ✏️
                  </button>
                )}

                {member.uid === user.uid && (
                  <span className={styles.memberYouBadge}>Tú</span>
                )}
              </div>

              <span className={styles.memberRole}>{member.role}</span>
            </div>
          </li>
        ))}
      </ul>

      {leaveError && <p className={styles.error}>{leaveError}</p>}

      <button
        onClick={() => setShowConfirmModal(true)}
        className={styles.leaveTeamButton}
      >
        Salir del Equipo
      </button>

      {/* MODAL EDITAR EQUIPO */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      >
        <EditTeamForm
          teamData={teamData}
          onClose={() => setIsEditModalOpen(false)}
          onTeamUpdated={handleTeamUpdated}
        />
      </Modal>

      {/* MODAL EDITAR ROL */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      >
        <div className={styles.roleModal}>
          <h3 className={styles.roleModalTitle}>Editar Rol</h3>
          <p >
            Miembro: <strong className={styles.roleModalMember}>{memberToEdit?.name}</strong>
          </p>

          <div className={styles.roleModalField}>
            <label className={styles.roleModalLabel}>
              Seleccionar nuevo rol:
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className={styles.roleModalSelect}
            >
              <option value="Miembro">Miembro</option>
              <option value="Veterano">Veterano</option>
              <option value="Comandante">Comandante</option>
            </select>
          </div>

          <div className={styles.roleModalActions}>
            <button
              onClick={() => setIsRoleModalOpen(false)}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              Cancelar
            </button>
            <button onClick={handleSaveRole} className={styles.createButton}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL EVENTOS */}
      <TeamEventsModal
        isOpen={isEventsModalOpen}
        onClose={() => setIsEventsModalOpen(false)}
        teamId={teamData.id}
        canCreate={canCreateEvents}
      />

      {/* MODAL CONFIRMAR SALIDA */}
      {showConfirmModal && (
        <Modal isOpen={true} onClose={() => setShowConfirmModal(false)}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>
              {user.uid === teamData.owner_uid
                ? "⚠️ Eres el dueño. Si sales, el equipo se eliminará permanentemente para todos. ¿Estás seguro?"
                : `¿Estás seguro de que quieres salir de "${teamData.team_name}"?`}
            </p>

            <div className={styles.confirmButtons}>
              <button
                className={styles.confirmAccept}
                onClick={() => {
                  setShowConfirmModal(false);
                  handleLeaveTeam();
                }}
              >
                Aceptar
              </button>

              <button
                className={styles.confirmCancel}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toastMessage && <LiveToast key={toastKey} message={toastMessage} />}
    </div>
  );
}

export default MyTeamInfo;
