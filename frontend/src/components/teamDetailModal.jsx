import React, { useState, useEffect } from 'react';
import Modal from './modal'; // Asumiendo que tu Modal base está en './Modal'
import styles from './teamDetailModal.module.css'; // Reutilizamos los estilos
import API_URL from '../config'; 


function TeamDetailModal({ team, isOpen, onClose, onJoin }) {
  // 'team' es el objeto básico de la lista (sin nombres de miembros)
  
  const [details, setDetails] = useState(null); // Aquí guardaremos los detalles completos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Este hook se dispara CADA VEZ que el modal se abre (cuando 'isOpen' cambia a true)
  useEffect(() => {
    // Si el modal no está abierto o no hay equipo, no hagas nada
    if (!isOpen || !team) {
      return;
    }

    const fetchTeamDetails = async () => {
      setLoading(true);
      setError(null);
      setDetails(null); // Limpia detalles anteriores

      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        setError("Error de autenticación");
        setLoading(false);
        return;
      }

      try {
        // ¡Llama a la nueva ruta del backend!
        const response = await fetch(`${API_URL}/api/teams/${team.id}/details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        const data = await response.json();
        setDetails(data); // ¡Guarda los detalles completos (con nombres)!

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [isOpen, team]); // Se vuelve a ejecutar si el 'team' o 'isOpen' cambian

  // Renderizado del Modal
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {team && ( // Muestra el contenido solo si hay un 'team'
        <div className={styles.container}>
          <h2>{team.team_name}</h2>
          <p className={styles.sportType}>Deporte: {team.sport_type}</p>
          <p className={styles.description}>{team.description}</p>
          
          <h3>Miembros ({team.member_count}):</h3>

          {/* --- Lógica de Renderizado de Miembros --- */}
          {loading && <p>Cargando miembros...</p>}
          {error && <p className={styles.error}>{error}</p>}
          
          {/* Si tenemos los detalles, los mostramos */}
          {details && (
            <ul className={styles.memberList}>
              {details.members?.map(member => (
          // 1. El 'li' principal con la key
          <li key={member.uid} className={styles.memberItem}>
            
            {/* 2. El nombre del miembro */}
            <span className={styles.memberName}>{member.name}</span>
          </li>
        ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
          Cerrar
        </button>
        <button onClick={() => onJoin(team.id, team.team_name)} className={`${styles.button} ${styles.joinButton}`}>
          Unirse al Equipo
        </button>
      </div>
    </Modal>
  );
}

export default TeamDetailModal;