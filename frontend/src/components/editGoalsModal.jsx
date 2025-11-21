import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/authContext';
// Reutilizamos los estilos del formulario de equipos para mantener consistencia
import styles from './CreateTeamForm.module.css'; 

function EditGoalsModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para Running
  const [runPace, setRunPace] = useState(''); // Minutos por km (ej. 5.30)
  const [runDist, setRunDist] = useState(''); // Km

  // Estados para Cycling
  const [cycleSpeed, setCycleSpeed] = useState(''); // Km/h
  const [cycleDist, setCycleDist] = useState(''); // Km

  // Cargar datos existentes cuando se abre el modal
  useEffect(() => {
    if (user && isOpen) {
      // Usamos optional chaining (?.) por si performance aún no existe
      setRunPace(user.performance?.running?.pace || '');
      setRunDist(user.performance?.running?.distance || '');
      setCycleSpeed(user.performance?.cycling?.speed || '');
      setCycleDist(user.performance?.cycling?.distance || '');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('firebaseToken');
    if (!token) {
        setError("Error de autenticación");
        setIsLoading(false);
        return;
    }

    // Preparamos el objeto. Convertimos a Float para guardar números, no strings.
    const performanceData = {
      running: { 
        pace: runPace ? parseFloat(runPace) : null, 
        distance: runDist ? parseFloat(runDist) : null 
      },
      cycling: { 
        speed: cycleSpeed ? parseFloat(cycleSpeed) : null, 
        distance: cycleDist ? parseFloat(cycleDist) : null 
      }
    };

    try {
      // Usamos ruta relativa, el proxy o config.js se encarga de la URL base
      const response = await fetch('/api/users/goals', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ performance: performanceData })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar las metas');
      }

      // Éxito
      await refreshUser(); // Actualiza los datos en la app
      alert("¡Metas actualizadas correctamente!");
      onClose();

    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Mis Metas y Rendimiento</h2>
        
        {error && <p className={styles.error}>{error}</p>}

        {/* Sección Running */}
        <div style={{ marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #eee' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0056b3', marginBottom: 10 }}>🏃‍♂️ Running</h3>
            
            <div className={styles.inputGroup}>
            <label>Ritmo promedio (min/km):</label>
            <input 
                type="number" 
                step="0.01" 
                placeholder="Ej. 5.30" 
                value={runPace} 
                onChange={e => setRunPace(e.target.value)} 
            />
            <small style={{color: '#888'}}>Ej: 5.30 significa 5 minutos 30 segundos por km.</small>
            </div>
            
            <div className={styles.inputGroup} style={{marginTop: 10}}>
            <label>Distancia habitual (km):</label>
            <input 
                type="number" 
                step="0.1"
                placeholder="Ej. 10" 
                value={runDist} 
                onChange={e => setRunDist(e.target.value)} 
            />
            </div>
        </div>

        {/* Sección Cycling */}
        <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0056b3', marginBottom: 10 }}>🚴‍♀️ Ciclismo</h3>
            
            <div className={styles.inputGroup}>
            <label>Velocidad promedio (km/h):</label>
            <input 
                type="number" 
                step="0.1"
                placeholder="Ej. 25.5" 
                value={cycleSpeed} 
                onChange={e => setCycleSpeed(e.target.value)} 
            />
            </div>
            
            <div className={styles.inputGroup} style={{marginTop: 10}}>
            <label>Distancia habitual (km):</label>
            <input 
                type="number" 
                step="0.1"
                placeholder="Ej. 40" 
                value={cycleDist} 
                onChange={e => setCycleDist(e.target.value)} 
            />
            </div>
        </div>

        <div className={styles.buttonContainer}>
          <button 
            type="button" 
            onClick={onClose} 
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditGoalsModal;