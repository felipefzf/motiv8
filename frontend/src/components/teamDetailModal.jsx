import React, { useState, useEffect } from 'react';
import Modal from './modal'; // Asumiendo que tu Modal base está en './Modal'
import styles from './teamDetailModal.module.css'; // Reutilizamos los estilos
import API_URL from '../config'; 
import Bicycle from '../assets/bicycle.png';
import Running from '../assets/run.png';


function TeamDetailModal({ team, isOpen, onClose, onJoin, canJoin }) {
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
          {team.sport_type === 'Running' ? (
            <img src={Running} alt="Running" className={styles.sportIcon} />
          ) : (
            <img src={Bicycle} alt="Cycling" className={styles.sportIcon} />
          )}

          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeeba', 
            borderRadius: '5px', 
            padding: '10px', 
            margin: '15px 0' 
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#856404', fontSize: '1rem' }}>
              Requisitos de Entrada:
            </h4>
            
            {/* Verificamos si requirements existe y tiene alguna llave */}
            {(!team.requirements || Object.keys(team.requirements).length === 0) ? (
               <p className={styles.noRequirements}>Ninguno. ¡Todos bienvenidos!</p>
            ) : (
               <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#856404' }}>
                 
                 {/* RITMO (Running) */}
                 {team.requirements.pace > 0 && (
                   <li>🏃‍♂️ Ritmo máx: <strong>{team.requirements.pace} min/km</strong></li>
                 )}
                 
                 {/* VELOCIDAD (Cycling) */}
                 {team.requirements.speed > 0 && (
                   <li>🚴‍♀️ Velocidad mínima: <strong>{team.requirements.speed} km/h</strong></li>
                 )}
                 
                 {/* DISTANCIA (Ambos) */}
                 {team.requirements.distance > 0 && (
                   <li>📏 Distancia mínima: <strong>{team.requirements.distance} km</strong></li>
                 )}
               </ul>
            )}

            {/* Mensaje de error si no cumple */}
            {!canJoin && (
              <div style={{ borderTop: '1px solid #faebcc', marginTop: '8px', paddingTop: '5px', color: '#dc3545', fontWeight: 'bold', fontSize: '0.85rem' }}>
                ⛔ Tu rendimiento actual no es suficiente para unirte.
              </div>
            )}
          </div>
          
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
        <button 
              onClick={() => onJoin(team.id, team.team_name)} 
              
              // A. Deshabilita la funcionalidad
              disabled={!canJoin} 
              
              // B. Cambia el estilo visualmente
              className={`${styles.button} ${styles.joinButton}`}
              style={{ 
                opacity: canJoin ? 1 : 0.5, 
                cursor: canJoin ? 'pointer' : 'not-allowed',
                backgroundColor: canJoin ? '#28a745' : '#ccc' // Verde si puede, Gris si no
              }}
            >
              {/* C. Cambia el texto para ser claro */}
              {canJoin ? 'Unirse al Equipo' : 'Requisitos no cumplidos'}
            </button>
      </div>
    </Modal>
  );
}

export default TeamDetailModal;