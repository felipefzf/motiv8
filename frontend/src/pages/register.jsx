// frontend/src/App.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css'; // 👈 Importamos los estilos externos
import { regionesYcomunas } from "../utils/funcionUtils"
import axios from 'axios';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview, getCanvasBlob } from '../utils/canvasPreview';
import styles from '../components/CreateTeamForm.module.css';
import API_URL from '../config'; // (Ajusta la ruta de importación)

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth, mediaHeight
  );
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [region, setRegion] = useState(''); 
  const [comuna, setComuna] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [main_sport, setMain_sport] = useState('');

  const [runPace, setRunPace] = useState(''); // Minutos por km (ej. 5.30)
  const [runDist, setRunDist] = useState(''); // Km

  const [cycleSpeed, setCycleSpeed] = useState(''); // Km/h
  const [cycleDist, setCycleDist] = useState(''); // Km


  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blobToSend, setBlobToSend] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

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
    if (completedCrop && imgRef.current && canvasRef.current) {
      canvasPreview(imgRef.current, canvasRef.current, completedCrop);
      const blob = await getCanvasBlob(canvasRef.current);
      setBlobToSend(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setImgSrc(''); // Ocultar cropper
    }
  };

  const handleRegionChange = (e) => {
    const selectedRegion = e.target.value;
    setRegion(selectedRegion);
    // 💡 Resetear la comuna cuando cambia la región
    setComuna(''); 
  };
  const handleComunaChange = (e) => {
    setComuna(e.target.value);
  };

  const comunasDeRegion = region 
    ? regionesYcomunas.find(r => r.region === region)?.comunas || []
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!region || !comuna) {
        setError('Por favor, selecciona una Región y una Comuna.');
        return;
    }

    // Validar entradas numéricas
    if (main_sport === 'running' && (!runPace || !runDist)) {
      setError('Por favor, ingresa tu ritmo de corrida (minutos por km) y distancia (km).');
      return;
    }
    if (main_sport === 'cycling' && (!cycleSpeed || !cycleDist)) {
      setError('Por favor, ingresa tu velocidad de ciclismo (km/h) y distancia (km).');
      return;
    }

    // Preparar datos de rendimiento
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

    setIsLoading(true);

    console.log("Preparando FormData")

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('name', name);
    formData.append('region', region);
    formData.append('comuna', comuna);
    formData.append('main_sport', main_sport);
  formData.append('performance', JSON.stringify(performanceData));

    console.log("Estado del Blob de imagen:", blobToSend);

    if (blobToSend) {
      formData.append('profile_image_file', blobToSend, 'avatar.jpg');
    }

    try {
      console.log("Enviando fetch al backend...");
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
      });

      console.log("Respuesta recibida, status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newUser = await response.json();
      console.log('Usuario registrado:', newUser);
      await axios.post('/api/user/initStats', { uid: newUser.uid });
      alert('Registro exitoso. Puedes iniciar sesión ahora.');
      window.location.href = '/login';
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <h1 className='register-title'>MOTIV8</h1>
      <h2 className='register-subtitle'>Registrar Usuario</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Correo"
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nombre"
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Contraseña"
          />
        </div>
        
        <div className="form-group">
          <select
            id="main_sport"
            value={main_sport}
            onChange={(e) => setMain_sport(e.target.value)}
            required
            className='register-select'
          >
            <option value="">cuál es tu Deporte Principal?</option>
            <option value="running">Running</option>
            <option value="cycling">Cycling</option>
          </select>
        </div>
        
        {/* Campos de Rendimiento */}
        {main_sport === 'running' && (
          <div className="form-group">
            <input
              type="number"
              id="runPace"
              value={runPace}
              onChange={(e) => setRunPace(e.target.value)}
              required
              placeholder="Ritmo de Corrida (min/km)"
            />
          </div>
        )}
        {main_sport === 'running' && (
          <div className="form-group">
            <input
              type="number"
              id="runDist"
              value={runDist}
              onChange={(e) => setRunDist(e.target.value)}
              required
              placeholder="Distancia promedio (km)"
            />
          </div>
        )}
        {main_sport === 'cycling' && (
          <div className="form-group">
            <input
              type="number"
              id="cycleSpeed"
              value={cycleSpeed}
              onChange={(e) => setCycleSpeed(e.target.value)}
              required
              placeholder="Velocidad promedio (km/h)"
            />
          </div>
        )}
        {main_sport === 'cycling' && (
          <div className="form-group">
            <input
              type="number"
              id="cycleDist"
              value={cycleDist}
              onChange={(e) => setCycleDist(e.target.value)}
              required
              placeholder="Distancia promedio (km)"
            />
          </div>
        )}
        <div>
          <label style={{fontWeight: 'bold'}}>Foto de Perfil (Opcional):</label>
          <input type="file" accept="image/*" onChange={onSelectFile} />
        </div>

        {/* Cropper UI (Reutilizando clases de CreateTeamForm si las importaste, o inline) */}
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
            <button type="button" onClick={handleSaveCrop} style={{marginTop: 10, padding: '5px 10px', background: 'green', color: 'white', border: 'none'}}>
              Confirmar Recorte
            </button>
          </div>
        )}

        {/* Vista Previa Final */}
        {!!previewUrl && !imgSrc && (
          <div style={{textAlign: 'center'}}>
            <img src={previewUrl} alt="Avatar Previo" style={{width: 100, height: 100, borderRadius: '50%', border: '2px solid #ccc'}} />
          </div>
        )}

        {/* Canvas Oculto */}
        <canvas ref={canvasRef} style={{ display: 'none', width: completedCrop?.width, height: completedCrop?.height }} />

        <div className="form-group">
          <select
            id="region"
            value={region}
            onChange={handleRegionChange}
            required
            // Asegúrate de definir esta clase en Register.css
            className='register-select' 
          >
            <option value="">Selecciona una Región</option>
            {/* Mapeamos las opciones usando tu array regionesYcomunas */}
            {regionesYcomunas.map((r) => (
              <option key={r.region} value={r.region}>
                {r.region}
              </option>
            ))}
          </select>
        </div>

        {/* --- SELECTOR DE COMUNA --- */}
        <div className="form-group">
          <select
            id="comuna"
            value={comuna}
            onChange={handleComunaChange}
            required
            // Deshabilitado si no hay región seleccionada
            disabled={!region} 
            className='register-select'
          >
            <option value="">Selecciona una Comuna</option>
            {/* Mapeamos las comunas filtradas */}
            {comunasDeRegion.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="register-button">
          Registrar
        </button>

        <Link to="/login" className="back-link">
          Volver a Login
        </Link>
      </form>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
