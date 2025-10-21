import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Estilos básicos para el componente (puedes moverlos a un .css)
const styles = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  form: { 
    background: '#f4f4f4', 
    padding: '20px', 
    borderRadius: '8px', 
    marginBottom: '30px', 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '10px'
  },
  inputGroup: { flex: '1 1 300px', display: 'flex', flexDirection: 'column' },
  input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
  button: { 
    padding: '10px 15px', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontSize: '16px', 
    fontWeight: 'bold',
    alignSelf: 'flex-end'
  },
  createButton: { backgroundColor: '#007bff', color: 'white' },
  updateButton: { backgroundColor: '#28a745', color: 'white' },
  cancelButton: { backgroundColor: '#6c757d', color: 'white' },
  list: { listStyle: 'none', padding: 0 },
  listItem: { 
    background: '#fff', 
    border: '1px solid #ddd', 
    padding: '15px', 
    marginBottom: '10px', 
    borderRadius: '8px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  listItemButtons: { display: 'flex', gap: '10px' },
  editButton: { backgroundColor: '#ffc107' },
  deleteButton: { backgroundColor: '#dc3545', color: 'white' },
  error: { color: 'red', fontWeight: 'bold' }
};

// Estado inicial vacío para el formulario
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

function AdminDashboard() {
  const [missions, setMissions] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null); // null = creando, 'id' = editando
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- 1. FUNCIÓN AUXILIAR PARA OBTENER EL TOKEN ---
  const getToken = () => {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      // Si no hay token, redirige al login
      navigate('/login');
    }
    return token;
  };

  // --- 2. READ (LEER) ---
  const fetchMissions = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch('/api/missions', { // Asumiendo proxy
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('No autorizado. Vuelve a iniciar sesión.');
      }
      if (!response.ok) throw new Error('No se pudieron cargar las misiones.');

      const data = await response.json();
      setMissions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carga las misiones al iniciar el componente
  useEffect(() => {
    fetchMissions();
  }, []);

  // --- 3. CREATE / UPDATE (MANEJADOR DEL FORMULARIO) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) return;

    // Decide si es CREATE (POST) o UPDATE (PUT)
    const isUpdating = editingId !== null;
    const url = isUpdating ? `/api/missions/${editingId}` : '/api/missions';
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

      if (response.status === 403) {
        throw new Error('Acción prohibida. No tienes permisos de administrador.');
      }
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Error al ${isUpdating ? 'actualizar' : 'crear'} la misión.`);
      }
      
      // Éxito: Limpia el formulario y recarga la lista
      setFormData(initialState);
      setEditingId(null);
      fetchMissions(); // Recarga la lista de misiones

    } catch (err) {
      setError(err.message);
    }
  };

  // --- 4. DELETE (ELIMINAR) ---
  const handleDelete = async (id) => {
    // Simple confirmación
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta misión?')) {
      return;
    }

    setError(null);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/missions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        throw new Error('Acción prohibida. No tienes permisos de administrador.');
      }
      if (!response.ok) throw new Error('Error al eliminar la misión.');

      // Éxito: Recarga la lista
      fetchMissions(); 
      
    } catch (err) {
      setError(err.message);
    }
  };

  // --- 5. FUNCIONES AUXILIARES DEL FORMULARIO ---
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  // Prepara el formulario para editar una misión
  const handleEditClick = (mission) => {
    setEditingId(mission.id);
    // Firestore devuelve fechas como ISO strings, el input[type=date] las maneja bien si cortamos la hora
    const formattedMission = {
      ...mission,
      startDate: mission.startDate ? mission.startDate.split('T')[0] : '',
      endDate: mission.endDate ? mission.endDate.split('T')[0] : ''
    };
    setFormData(formattedMission);
    window.scrollTo(0, 0); // Sube al inicio de la página para ver el form
  };

  // Cancela la edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialState);
    setError(null);
  };

  // --- 6. RENDERIZADO DEL COMPONENTE ---
  return (
    <div style={styles.container}>
      <h1>Panel de Administrador de Misiones</h1>

      {/* --- FORMULARIO DE CREAR / EDITAR --- */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>{editingId ? 'Actualizar Misión' : 'Crear Nueva Misión'}</h3>
        
        <div style={{...styles.inputGroup, flexBasis: '100%'}}>
          <label>Nombre</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={{...styles.inputGroup, flexBasis: '100%'}}>
          <label>Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} style={styles.input} />
        </div>
        
        <div style={styles.inputGroup}>
          <label>Tipo</label>
          <select name="type" value={formData.type} onChange={handleInputChange} style={styles.input}>
            <option value="distance">Distancia</option>
            <option value="time">Tiempo</option>
            <option value="calories">Calorías</option>
          </select>
        </div>
        <div style={styles.inputGroup}>
          <label>Objetivo (Valor)</label>
          <input type="number" name="targetValue" value={formData.targetValue} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label>Unidad (ej: km, min, kcal)</label>
          <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label>Recompensa (Puntos)</label>
          <input type="number" name="reward" value={formData.reward} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label>Fecha de Inicio</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label>Fecha de Fin</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} style={styles.input} />
        </div>

        <div style={{...styles.inputGroup, flexBasis: '100%', alignItems: 'flex-end', gap: '10px', flexDirection: 'row'}}>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{...styles.button, ...styles.cancelButton}}>
              Cancelar
            </button>
          )}
          <button type="submit" style={{...styles.button, ...(editingId ? styles.updateButton : styles.createButton)}}>
            {editingId ? 'Actualizar Misión' : 'Crear Misión'}
          </button>
        </div>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {/* --- LISTA DE MISIONES --- */}
      <h2>Misiones Activas</h2>
      {loading ? (
        <p>Cargando misiones...</p>
      ) : (
        <ul style={styles.list}>
          {missions.map(mission => (
            <li key={mission.id} style={styles.listItem}>
              <div>
                <strong>{mission.name}</strong> ({mission.type})
                <p>{mission.description}</p>
                <small>Recompensa: {mission.reward} puntos | Fin: {mission.endDate || 'N/A'}</small>
              </div>
              <div style={styles.listItemButtons}>
                <button onClick={() => handleEditClick(mission)} style={{...styles.button, ...styles.editButton}}>
                  Editar
                </button>
                <button onClick={() => handleDelete(mission.id)} style={{...styles.button, ...styles.deleteButton}}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminDashboard;