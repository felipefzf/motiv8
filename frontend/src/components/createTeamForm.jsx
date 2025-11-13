import React, { useState } from 'react';
import { useAuth } from '../context/authContext'; // To get the user token
import styles from './CreateTeamForm.module.css'; // We'll create this CSS file

// Renamed props for clarity (match backend expectations)
function CreateTeamForm({ onClose, onTeamCreated }) {
  const { user } = useAuth(); // Get user info if needed, mainly for token
  const [team_name, setTeamName] = useState('');
  const [sport_type, setSportType] = useState(''); // Changed name
  const [description, setDescription] = useState(''); // Changed name
  const [team_color, setTeamColor] = useState('#CCCCCC'); // New field for team color
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamImageFile, setTeamImageFile] = useState(null); // New state for team image file

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setTeamImageFile(file); // <-- Guarda en 'teamImageFile'
      setError('');
    } else {
      setTeamImageFile(null); // Limpia si no es válido
      setError('Por favor, sube un archivo de imagen válido.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const token = localStorage.getItem('firebaseToken'); // Get token for API call
    if (!token) {
      setError('Authentication error. Please log in again.');
      setIsLoading(false);
      return;
    }

    console.log("Archivo seleccionado en el frontend:", teamImageFile);

    // FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('team_name', team_name);
    formData.append('sport_type', sport_type); // Send the new field name
    formData.append('description', description);
    formData.append('team_color', team_color); // Send the new field name
    if (teamImageFile) {
      formData.append('teamImageFile', teamImageFile);
    }

    for (let key of formData.keys()) {
      console.log("Enviando llave:", key);
    }
    // Data matching the backend expected fields

    try {
      const response = await fetch('/api/teams', { // Use relative path with proxy
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Send the token
        },
        body: formData, // Send FormData instead of JSON
      });

      const data = await response.json();

      if (!response.ok) {
        // Use error message from backend if available
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      // Success!
      alert('Equipo creado con éxito!'); // Simple feedback
      onTeamCreated(data); // Notify parent component (JoinTeamView)
      onClose(); // Close the modal

    } catch (err) {
      setError(err.message || 'Error creating team. Please try again.');
      console.error('Error creating team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Crear Nuevo Equipo</h2>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.inputGroup}>
        <label htmlFor="team_name">Nombre del equipo</label>
        <input
          type="text"
          id="team_name"
          value={team_name}
          onChange={(e) => setTeamName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="team_image">Logo del Equipo (Opcional):</label>
        <input
          type="file"
          id="team_image"
          accept="image/png, image/jpeg"
          onChange={handleFileChange} // Usa el nuevo handler
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows="3"
          disabled={isLoading}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="sport_type">Tipo de deporte</label>
        <select
          id="sport_type"
          value={sport_type}
          onChange={(e) => setSportType(e.target.value)}
          required
          disabled={isLoading}
        >
          <option value="">Selecciona un deporte</option>
          <option value="Running">Running</option>
          <option value="Cycling">Cycling</option>
          {/* Add other sports if needed */}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="team_color">Color del equipo</label>
        <input style={{ width: '100%', height: '45px' }}
          type="color"
          id="team_color"
          value={team_color}
          onChange={(e) => setTeamColor(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      

      <div className={styles.buttonContainer}>
        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>
          Cancelar
        </button>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Equipo'}
        </button>
      </div>
    </form>
  );
}

export default CreateTeamForm;