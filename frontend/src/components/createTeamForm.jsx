import React, { useState, useRef } from 'react';
import { useAuth } from '../context/authContext';
import styles from './CreateTeamForm.module.css';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { canvasPreview, getCanvasBlob } from '../utils/canvasPreview';

// Función auxiliar para centrar el crop inicial (como en el video)
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90, // Ocupar el 90% inicialmente
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function CreateTeamForm({ onClose, onTeamCreated }) {
  const { user } = useAuth();
  const [team_name, setTeamName] = useState('');
  const [sport_type, setSportType] = useState('');
  const [description, setDescription] = useState('');
  const [team_color, setTeamColor] = useState('#CCCCCC');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- ESTADOS PARA REACT-IMAGE-CROP ---
  const [imgSrc, setImgSrc] = useState('');        // La fuente de la imagen cargada
  const [crop, setCrop] = useState();              // El estado del recorte actual
  const [completedCrop, setCompletedCrop] = useState(null); // El recorte final en píxeles
  const [previewUrl, setPreviewUrl] = useState(null); // Para mostrar la imagen final al usuario
  const [blobToSend, setBlobToSend] = useState(null); // El archivo real para el backend
  
  const imgRef = useRef(null);    // Referencia a la imagen original
  const canvasRef = useRef(null); // Referencia al canvas oculto

  // 1. Cargar la imagen desde el input
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Resetear crop anterior
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // 2. Cuando la imagen carga, centrar el crop automáticamente
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    // Hacemos un crop cuadrado (aspect 1) y centrado
    const newCrop = centerAspectCrop(width, height, 1);
    setCrop(newCrop);
    setCompletedCrop(newCrop); // Inicializar completedCrop también
  };

  // 3. Función para confirmar el recorte (Botón "Guardar Recorte")
  const handleSaveCrop = async () => {
    if (completedCrop && imgRef.current && canvasRef.current) {
      // Dibujar en el canvas
      canvasPreview(imgRef.current, canvasRef.current, completedCrop);
      
      // Obtener el Blob para enviar
      const blob = await getCanvasBlob(canvasRef.current);
      setBlobToSend(blob);

      // Crear URL para mostrar al usuario que ya quedó listo
      const previewUrl = URL.createObjectURL(blob);
      setPreviewUrl(previewUrl);
      
      // Opcional: Limpiar la vista de edición para mostrar solo el resultado
      setImgSrc(''); 
    }
  };

  // --- ENVÍO AL BACKEND ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const token = localStorage.getItem('firebaseToken');
    if (!token) { /* Manejo de error */ setIsLoading(false); return; }

    const formData = new FormData();
    formData.append('team_name', team_name);
    formData.append('sport_type', sport_type);
    formData.append('description', description);
    formData.append('team_color', team_color);

    // Si tenemos un blob recortado, lo enviamos
    if (blobToSend) {
      formData.append('teamImageFile', blobToSend, 'logo.jpg');
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData);
      }
      const data = await response.json();
      alert('Equipo creado con éxito!');
      onTeamCreated(data);
      onClose();

    } catch (err) {
      setError(err.message || 'Error al crear equipo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Crear Nuevo Equipo</h2>
      {error && <p className={styles.error}>{error}</p>}

      {/* Inputs de texto normales... */}
      <div className={styles.inputGroup}>
        <label htmlFor="team_name">Nombre del Equipo</label>
        <input
          style={{ width: "100%", height: "45px" }}
          type="text"
          id="team_name"
          value={team_name}
          onChange={(e) => setTeamName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      {/* (Otros inputs: Descripción, Deporte, Color...) */}
      <div className={styles.inputGroup}>
        <label>Descripción</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="sport_type">Deporte</label>
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
          </select>      
        </div>
      <div className={styles.inputGroup}>
        <label htmlFor="team_color">Color del equipo</label>
        <input
          style={{ width: "100%", height: "45px" }}
          type="color"
          id="team_color"
          value={team_color}
          onChange={(e) => setTeamColor(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* --- SECCIÓN DE IMAGEN --- */}
      <div className={styles.inputGroup}>
        <label htmlFor="teamImageFile">Logo del Equipo</label>
        <input type="file" accept="image/*" onChange={onSelectFile} />
      </div>

      {/* A: Si hay imagen cargada, mostramos el Cropper */}
      {!!imgSrc && (
        <div className={styles.cropContainer}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop // ¡Esto hace que la guía sea redonda!
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: '300px' }} // Limita la altura para que no tape todo
            />
          </ReactCrop>
          
          <button type="button" onClick={handleSaveCrop} className={styles.saveCropButton}>
            Confirmar Recorte
          </button>
        </div>
      )}

      {/* B: Si ya se recortó, mostramos la vista previa final */}
      {!!previewUrl && !imgSrc && (
        <div className={styles.previewContainer}>
          <p>Imagen seleccionada:</p>
          <img src={previewUrl} alt="Vista previa" className={styles.previewImage} />
          <button type="button" onClick={() => setImgSrc(previewUrl)} className={styles.editButton}>
            Editar
          </button>
        </div>
      )}

      {/* Canvas Oculto (Necesario para procesar la imagen) */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none', width: completedCrop?.width, height: completedCrop?.height }}
      />
      
      {/* Botones finales */}
      <div className={styles.buttonContainer}>
        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Equipo'}
        </button>
      </div>
    </form>
  );
}

export default CreateTeamForm;