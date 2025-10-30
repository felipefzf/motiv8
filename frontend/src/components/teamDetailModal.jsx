import React from 'react';
import Modal from './modal'; // Your reusable Modal component
import styles from './teamDetailModal.module.css'; // We'll create this CSS file

function TeamDetailModal({ team, onClose, onJoin }) {
  if (!team) return null;

  return (
    <Modal className isOpen={!!team} onClose={onClose}>
      <div className={styles.container}>
        <h2>{team.team_name}</h2>
        <p className={styles.sportType}>Deporte: {team.sport_type}</p>
        <p className={styles.description}>{team.description}</p>

        <h3>Miembros ({team.member_count}):</h3>
        {team.members && team.members.length > 0 ? (
          <ul className={styles.memberList}>
            {team.members.map(member => (
              <li key={member.uid}>{member.name}</li>
            ))}
          </ul>
        ) : (
          <p>Aún no hay miembros.</p>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
            Cerrar
          </button>
          {/* Pass team id and name to the join handler */}
          <button onClick={() => onJoin(team.id, team.team_name)} className={`${styles.button} ${styles.joinButton}`}>
            Unirse al Equipo
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default TeamDetailModal;