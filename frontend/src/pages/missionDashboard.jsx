import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './missionDashboard.module.css';
import API_URL from '../config';
import Header from "../components/Header"; // 👈 IMPORTA EL HEADER


const initialState = {
  name: '',
  description: '',
  type: 'distance',
  targetValue: 0,
  unit: 'km',
  reward: 0,
  startDate: '',
  endDate: ''
};

function MissionDashboard() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para el Modal y el Formulario ---
  // const [isAdmin, setIsAdmin] = useState(false); // <-- YA NO SE NECESITA
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [formData, setFormData] = useState(initialState);

  const navigate = useNavigate();

  // --- 1. FUNCIÓN AUXILIAR PARA OBTENER EL TOKEN ---
  // (La seguimos necesitando para las llamadas a la API)
  const getToken = () => {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      navigate('/');
    }
    return token;
  };

  // --- 2. READ (LEER) ---
  const fetchMissions = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setLoading(false);
      return setError("No estás autenticado.");
    }

    try {
      const response = await fetch(`${API_URL}/api/missions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMissions(data);
    } catch (e) {
      setError("Error al cargar las misiones: " + e.message);
      console.error("Fetch missions error:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Carga misiones al inicio ---
  useEffect(() => {
    fetchMissions();
    // Ya no es necesario revisar el rol aquí
  }, []);

  // --- 4. FUNCIONES DEL MODAL (Abrir/Cerrar) ---
  // (Sin cambios aquí)
  const openCreateModal = () => {
    setEditingMission(null);
    setFormData(initialState);
    setIsModalOpen(true);
  };

  const openEditModal = (mission) => {
    setEditingMission(mission);
    const formattedMission = {
      ...mission,
      startDate: mission.startDate ? mission.startDate.split('T')[0] : '',
      endDate: mission.endDate ? mission.endDate.split('T')[0] : ''
    };
    setFormData(formattedMission);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  // --- 5. LÓGICA DEL FORMULARIO (Input y Submit) ---
  // (Sin cambios aquí)
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) return;

    const isUpdating = editingMission !== null;
    const url = isUpdating ? `${API_URL}/api/missions/${editingMission.id}` : `${API_URL}/api/missions`;
    const method = isUpdating ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData || `Error al ${isUpdating ? 'actualizar' : 'crear'} la misión.`);
      }

      closeModal();
      fetchMissions();

    } catch (err) {
      setError(err.message);
    }
  };

  // --- 6. DELETE (ELIMINAR) ---
  // (Sin cambios aquí)
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta misión?')) {
      return;
    }
    // ... (resto de la función handleDelete) ...
    setError(null);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/missions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la misión.');
      }

      fetchMissions();

    } catch (err) {
      setError(err.message);
    }
  };


  // --- 7. RENDERIZADO (Simplificado) ---
  if (loading) {
    return <p style={{ textAlign: 'center', margin: '20px' }}>Cargando misiones...</p>;
  }

  if (error && !isModalOpen) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.teamsPageWithHeader}>
        <Header title="Admin" />
        <br />
        <div className={styles.header}>
          <h2 className={styles.title}>Administador de Misiones</h2>
          {/* Botón "Crear" siempre visible */}
          <button onClick={openCreateModal} className={`${styles.button} ${styles.createButton}`}>
            Crear Misión
          </button>
        </div>

        {missions.length === 0 ? (
          <p>No hay misiones creadas aún.</p>
        ) : (
          <ul className={styles.list}>
            {missions.map(mission => (
              <li key={mission.id} className={styles.listItem}>
                <div className={styles.missionInfo}>
                  <h3 className={styles.missionName}>{mission.name}</h3>
                  <p><strong>Descripción:</strong> {mission.description}</p>
                  <p><strong>Objetivo:</strong> {mission.targetValue} {mission.unit} ({mission.type})</p>
                  <p><strong>Recompensa:</strong> {mission.reward}</p>
                  {mission.endDate && <p><strong>Fin:</strong> {mission.endDate}</p>}
                </div>

                {/* Botones "Editar/Eliminar" siempre visibles */}
                <div className={styles.listItemButtons}>
                  <button onClick={() => openEditModal(mission)} className={`${styles.button} ${styles.editButton}`}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(mission.id)} className={`${styles.button} ${styles.deleteButton}`}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* --- 8. LA VENTANA FLOTANTE (MODAL) --- */}
        {/* (Sin cambios aquí) */}
        {isModalOpen && (
          <div className={styles.modalBackdrop} onClick={closeModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>

              <form onSubmit={handleSubmit}>
                <h3>{editingMission ? 'Actualizar Misión' : 'Crear Nueva Misión'}</h3>

                {error && <p className={styles.error}>{error}</p>}

                {/* ... (resto del formulario) ... */}
                <div className={styles.inputGrid}>
                  <div className={styles.inputGroupFull}>
                    <label>Nombre:</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className={styles.inputGroupFull}>
                    <label>Descripción:</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="3"></textarea>
                  </div>
                  <div>
                    <label>Tipo:</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} required>
                      <option value="distance">Distancia</option>
                      <option value="time">Tiempo</option>
                      <option value="calories">Calorías</option>
                      <option value="count">Conteo</option>
                    </select>
                  </div>
                  <div>
                    <label>Valor Objetivo:</label>
                    <input type="number" name="targetValue" value={formData.targetValue} onChange={handleInputChange} required step="any" />
                  </div>
                  <div>
                    <label>Unidad:</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label>Recompensa:</label>
                    <input type="number" name="reward" value={formData.reward} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label>Fecha de Inicio:</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label>Fecha de Fin:</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="button" onClick={closeModal} className={`${styles.button} ${styles.cancelButton}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${styles.button} ${editingMission ? styles.updateButton : styles.createButton}`}>
                    {editingMission ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MissionDashboard;
