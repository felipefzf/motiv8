import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/authContext';
import styles from './CreateTeamForm.module.css'; // Reutilizamos estilos
import API_URL from '../config';

// 1. Imports del Cropper
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg } from '../utils/cropImage';

// Función auxiliar para centrar
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth, mediaHeight
  );
}

function EditTeamForm({ teamData, onClose, onTeamUpdated }) {
  const { user } = useAuth();
  
  // Estados inicializados con los datos del equipo
  const [team_name, setTeamName] = useState(teamData.team_name || '');
  const [sport_type, setSportType] = useState(teamData.sport_type || '');
  const [description, setDescription] = useState(teamData.description || '');
  const [team_color, setTeamColor] = useState(teamData.team_color || '#CCCCCC');
  
  // Estados de Requisitos (Desglosamos el objeto requirements)
  const [reqValue, setReqValue] = useState('');
  const [reqDist, setReqDist] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 2. ESTADOS DEL CROPPER ---
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // Vista previa local
  const [blobToSend, setBlobToSend] = useState(null); // El archivo a subir
  
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  // Cargar requisitos existentes al montar
  useEffect(() => {
    if (teamData.requirements) {
      const sport = (teamData.sport_type || '').toLowerCase();
      if (sport === 'running') {
        setReqValue(teamData.requirements.pace || '');
        setReqDist(teamData.requirements.distance || '');
      } else if (sport === 'cycling' || sport === 'ciclismo') {
        setReqValue(teamData.requirements.speed || '');
        setReqDist(teamData.requirements.distance || '');
      }
    }
  }, [teamData]);

  // --- 3. FUNCIONES DEL CROPPER ---
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result.toString()));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const newCrop = centerAspectCrop(width, height, 1);
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  };

  const handleSaveCrop = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        setBlobToSend(croppedBlob);
        setPreviewUrl(URL.createObjectURL(croppedBlob));
        setImgSrc(''); 
      } catch (e) {
        console.error(e);
        setError('Error al recortar imagen');
      }
    }
  };

  // --- 4. VALIDACIÓN DEL CREADOR (Tu lógica original) ---
  const validateCreatorEligibility = () => {
    const sport = sport_type ? sport_type.toLowerCase() : '';
    if (!user?.performance) {
      return { valid: false, msg: "Configura tus metas en el perfil primero." };
    }

    // === CASO RUNNING ===
    if (sport === 'running') {
      const reqPaceVal = reqValue ? parseFloat(reqValue) : null;
      const reqDistVal = reqDist ? parseFloat(reqDist) : null;
      if (reqPaceVal === null && reqDistVal === null) return { valid: true };

      const myStats = user.performance.running || {};
      const myPace = parseFloat(myStats.pace || 0);
      const myDist = parseFloat(myStats.distance || 0);

      if (reqPaceVal !== null) {
         if (myPace === 0) return { valid: false, msg: "No tienes ritmo registrado." };
         if (myPace > reqPaceVal) return { valid: false, msg: `Tu ritmo (${myPace}) es insuficiente.` };
      }
      if (reqDistVal !== null) {
         if (myDist === 0) return { valid: false, msg: "No tienes distancia registrada." };
         if (myDist < reqDistVal) return { valid: false, msg: `Tu distancia (${myDist}) es menor.` };
      }
    }

    // === CASO CYCLING ===
    if (sport === 'cycling' || sport === 'ciclismo') {
      const reqSpeedVal = reqValue ? parseFloat(reqValue) : null;
      const reqDistVal = reqDist ? parseFloat(reqDist) : null;
      if (reqSpeedVal === null && reqDistVal === null) return { valid: true };

      const myStats = user.performance.cycling || {};
      const mySpeed = parseFloat(myStats.speed || 0);
      const myDist = parseFloat(myStats.distance || 0);

      if (reqSpeedVal !== null) {
         if (mySpeed === 0) return { valid: false, msg: "No tienes velocidad registrada." };
         if (mySpeed < reqSpeedVal) return { valid: false, msg: `Tu velocidad (${mySpeed}) es menor.` };
      }
      if (reqDistVal !== null) {
         if (myDist === 0) return { valid: false, msg: "No tienes distancia registrada." };
         if (myDist < reqDistVal) return { valid: false, msg: `Tu distancia (${myDist}) es menor.` };
      }
    }
    return { valid: true };
  };

  // --- 5. SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('firebaseToken');
    if (!token) return;

    // Validar requisitos
    const finalValidation = validateCreatorEligibility();
    if (!finalValidation.valid) {
      setError(finalValidation.msg);
      setIsLoading(false); // Importante: desbloquear loading
      return; 
    }

    // 1. Reconstruir objeto Requirements
    const requirementsObj = {};
    const sport = sport_type.toLowerCase();
    if (sport === 'running') {
      if (reqValue) requirementsObj.pace = parseFloat(reqValue);
      if (reqDist) requirementsObj.distance = parseFloat(reqDist);
    } else if (sport.includes('cycl') || sport.includes('cicl')) {
      if (reqValue) requirementsObj.speed = parseFloat(reqValue);
      if (reqDist) requirementsObj.distance = parseFloat(reqDist);
    }

    // 2. FormData
    const formData = new FormData();
    formData.append('team_name', team_name);
    formData.append('sport_type', sport_type);
    formData.append('description', description);
    formData.append('team_color', team_color);
    formData.append('requirements', JSON.stringify(requirementsObj));

    // Solo enviamos imagen si hay una NUEVA recortada
    if (blobToSend) {
      formData.append('teamImageFile', blobToSend, 'logo_editado.png');
    }

    try {
      // 3. FETCH PUT
      const response = await fetch(`${API_URL}/api/teams/${teamData.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error(await response.text());

      const updatedData = await response.json();
      alert('Equipo actualizado!');
      onTeamUpdated(updatedData); 
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Editar Equipo</h2>

      <div className={styles.inputGroup}>
        <label>Nombre</label>
        <input type="text" value={team_name} onChange={e => setTeamName(e.target.value)} required />
      </div>

      {/* --- SECCIÓN DE IMAGEN (CROPPER) --- */}
      <div className={styles.inputGroup}>
        <label>Cambiar Logo (Opcional)</label>
        <input type="file" accept="image/*" onChange={onSelectFile} />
      </div>

      {/* Cropper UI */}
      {!!imgSrc && (
        <div className={styles.cropContainer}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '300px' }} />
          </ReactCrop>
          <button type="button" onClick={handleSaveCrop} className={styles.saveCropButton}>
            Confirmar Recorte
          </button>
        </div>
      )}

      {/* Vista Previa */}
      {!!previewUrl && !imgSrc && (
        <div className={styles.previewContainer}>
          <p>Nueva imagen lista:</p>
          <img src={previewUrl} alt="Vista previa" className={styles.previewImage} />
          <button type="button" onClick={() => setImgSrc(previewUrl)} className={styles.editButton}>
            Editar otra vez
          </button>
        </div>
      )}

      <div className={styles.inputGroup}>
        <label>Descripción</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} required rows="3" />
      </div>

      <div className={styles.inputGroup}>
        <label>Tipo de deporte</label>
        <select value={sport_type} onChange={e => setSportType(e.target.value)}>
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
        </select>
      </div>

      {/* Inputs de Requisitos */}
      <div className={styles.requirements}>
          <h4>Requisitos</h4>
          <div className={styles.inputGroup}>
            <label>{sport_type === 'running' ? 'Ritmo Máx (min/km)' : 'Velocidad Mín (km/h)'}</label>
            <input type="number" step="0.1" value={reqValue} onChange={e => setReqValue(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label>Distancia Mín (km)</label>
            <input type="number" value={reqDist} onChange={e => setReqDist(e.target.value)} />
          </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}


      <div className={styles.inputGroup}>
        <label>Color del equipo</label>
          <input style={{height: '45px'}} type="color" value={team_color} onChange={e => setTeamColor(e.target.value)} />
      </div>

      <div className={styles.buttonContainer}>
        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}

export default EditTeamForm;