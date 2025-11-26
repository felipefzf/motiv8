// src/components/teamDetailModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "./modal";
import styles from "./teamDetailModal.module.css";
import API_URL from "../config";
import Bicycle from "../assets/bicycle.png";
import Running from "../assets/run.png";

function TeamDetailModal({ team, isOpen, onClose, onJoin, canJoin }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !team) return;

    const fetchTeamDetails = async () => {
      setLoading(true);
      setError(null);
      setDetails(null);

      const token = localStorage.getItem("firebaseToken");
      if (!token) {
        setError("Error de autenticación");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/teams/${team.id}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        setDetails(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [isOpen, team]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {team && (
        <div className={styles.container}>
          <h2>{team.team_name}</h2>
          <br />
          <p className={styles.sportType}>Deporte: {team.sport_type}</p>
          <p className={styles.description}>{team.description}</p>
          {team.sport_type === "Running" ? (
            <img src={Running} alt="Running" className={styles.sportIcon} />
          ) : (
            <img src={Bicycle} alt="Cycling" className={styles.sportIcon} />
          )}
          {/* Bloque de requisitos */}
          <div className={styles.requirementsBox}>
            <h4 className={styles.requirementsTitle}>Requisitos de Entrada:</h4>

            {(!team.requirements ||
              Object.keys(team.requirements).length === 0) ? (
              <p className={styles.noRequirements}>
                Ninguno. ¡Todos bienvenidos!
              </p>
            ) : (
              <ul className={styles.requirementsList}>
                {team.requirements.pace > 0 && (
                  <li>
                    🏃‍♂️ Ritmo máx:{" "}
                    <strong>{team.requirements.pace} min/km</strong>
                  </li>
                )}

                {team.requirements.speed > 0 && (
                  <li>
                    🚴‍♀️ Velocidad mínima:{" "}
                    <strong>{team.requirements.speed} km/h</strong>
                  </li>
                )}

                {team.requirements.distance > 0 && (
                  <li>
                    📏 Distancia mínima:{" "}
                    <strong>{team.requirements.distance} km</strong>
                  </li>
                )}
              </ul>
            )}

            {!canJoin && (
              <div className={styles.requirementsErrorMsg}>
                ⛔ Tu rendimiento actual no es suficiente para unirte.
              </div>
            )}
          </div>

          <h3>Miembros ({team.member_count}):</h3>

          {loading && <p>Cargando miembros...</p>}
          {error && <p className={styles.error}>{error}</p>}

          {details && (
            <ul className={styles.memberList}>
              {details.members?.map((member) => (
                <li key={member.uid} className={styles.memberItem}>
                  <span className={styles.memberName}>{member.name}</span>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.actions}>
            <button
              onClick={onClose}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              Cerrar
            </button>

            <button
              onClick={() => onJoin(team.id, team.team_name)}
              disabled={!canJoin}
              className={`${styles.button} ${styles.joinButton} ${
                !canJoin ? styles.joinButtonDisabled : ""
              }`}
            >
              {canJoin ? "Unirse al Equipo" : "Requisitos no cumplidos"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default TeamDetailModal;
