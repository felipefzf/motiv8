

import React, { useState, useRef } from "react";
import { useAuth } from "../context/authContext";
import styles from "./CreateTeamForm.module.css";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import API_URL from "../config";
import { canvasPreview, getCanvasBlob } from "../utils/canvasPreview";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%", 
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function CreateTeamForm({ onClose, onTeamCreated, showToast }) {
  const { user } = useAuth();
  const [team_name, setTeamName] = useState("");
  const [sport_type, setSportType] = useState("");
  const [description, setDescription] = useState("");
  const [team_color, setTeamColor] = useState("#CCCCCC");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [runPaceRequirement, setRunPaceRequirement] = useState(''); 
  const [runDistRequirement, setRunDistRequirement] = useState(''); 

  const [cycleSpeedRequirement, setCycleSpeedRequirement] = useState(''); 
  const [cycleDistRequirement, setCycleDistRequirement] = useState('');

  const [reqValue, setReqValue] = useState(''); 
  const [reqDist, setReqDist] = useState('');   


  const [imgSrc, setImgSrc] = useState("");
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
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const validateCreatorEligibility = () => {
    const sport = sport_type ? sport_type.toLowerCase() : '';

 
    if (!user?.performance) {
      return { valid: false, msg: "Configura tus metas en el perfil primero." };
    }

    // === CASO RUNNING ===
    if (sport === 'running') {
      
      const reqPaceVal = runPaceRequirement ? parseFloat(runPaceRequirement) : null;
      const reqDistVal = runDistRequirement ? parseFloat(runDistRequirement) : null;
      
   
      if (reqPaceVal === null && reqDistVal === null) return { valid: true };

      const myStats = user.performance.running || {};
      const myPace = parseFloat(myStats.pace || 0);
      const myDist = parseFloat(myStats.distance || 0);

    
      if (reqPaceVal !== null) {
         if (myPace === 0) return { valid: false, msg: "No tienes ritmo registrado." };
         if (myPace > reqPaceVal) return { valid: false, msg: `Tu ritmo (${myPace}) es insuficiente para el requisito (${reqPaceVal}).` };
      }
   
      if (reqDistVal !== null) {
         if (myDist === 0) return { valid: false, msg: "No tienes distancia registrada." };
         if (myDist < reqDistVal) return { valid: false, msg: `Tu distancia (${myDist}) es menor a la exigida.` };
      }
    }

    // === CASO CYCLING ===
    if (sport === 'cycling' || sport === 'ciclismo') {
    
      const reqSpeedVal = cycleSpeedRequirement ? parseFloat(cycleSpeedRequirement) : null;
      const reqDistVal = cycleDistRequirement ? parseFloat(cycleDistRequirement) : null;

  
      if (reqSpeedVal === null && reqDistVal === null) return { valid: true };

      const myStats = user.performance.cycling || {};
      const mySpeed = parseFloat(myStats.speed || 0);
      const myDist = parseFloat(myStats.distance || 0);

    
      if (reqSpeedVal !== null) {
         if (mySpeed === 0) return { valid: false, msg: "No tienes velocidad registrada." };
         if (mySpeed < reqSpeedVal) return { valid: false, msg: `Tu velocidad (${mySpeed}) es menor a la exigida (${reqSpeedVal}).` };
      }
 
      if (reqDistVal !== null) {
         if (myDist === 0) return { valid: false, msg: "No tienes distancia registrada." };
         if (myDist < reqDistVal) return { valid: false, msg: `Tu distancia (${myDist}) es menor a la exigida (${reqDistVal}).` };
      }
    }

    return { valid: true };
  };


  const creatorStatus = validateCreatorEligibility();

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

      const previewUrl = URL.createObjectURL(blob);
      setPreviewUrl(previewUrl);
      setImgSrc("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!creatorStatus.valid) {
      setError(creatorStatus.msg);
      return;
    }

    const token = localStorage.getItem("firebaseToken");
    if (!token) {
      setIsLoading(false);
      setError("No autenticado.");
      return;
    }

    if (sport_type === 'running' && (!runPaceRequirement || !runDistRequirement)) {
      setError('Por favor, ingresa tu ritmo de corrida (minutos por km) y distancia (km).');
      return;
    }
    if (sport_type === 'cycling' && (!cycleSpeedRequirement || !cycleDistRequirement)) {
      setError('Por favor, ingresa tu velocidad de ciclismo (km/h) y distancia (km).');
      return;
    }

    const finalValidation = validateCreatorEligibility();

    if (!finalValidation.valid) {
      setError(finalValidation.msg);

      return; 
    }

    const requirementsData = {
      running: { pace: parseFloat(runPaceRequirement), distance: parseFloat(runDistRequirement) },
      cycling: { speed: parseFloat(cycleSpeedRequirement), distance: parseFloat(cycleDistRequirement) }
    };

    const formData = new FormData();
    formData.append("team_name", team_name);
    formData.append("sport_type", sport_type);
    formData.append("description", description);
    formData.append("team_color", team_color);
    formData.append("requirements", JSON.stringify(requirementsData[sport_type]));

    if (blobToSend) {
      formData.append("teamImageFile", blobToSend, "logo.jpg");
    }

    try {
      const response = await fetch(`${API_URL}/api/teams`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData || "Error al crear equipo");
      }

      const data = await response.json();
      if (typeof showToast === "function") {
        showToast("✅ Equipo creado con éxito!");
      }
      if (typeof onTeamCreated === "function") {
        onTeamCreated(data);
      }
    } catch (err) {
      setError(err.message || "Error al crear equipo");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    console.log("⚡ CAMBIO DE ESTADO DETECTADO:", {
      deporte: sport_type,
      valor_escrito: reqValue,
      distancia_escrita: reqDist
    });
    

    const resultado = validateCreatorEligibility();
    console.log("Resultado de validación en tiempo real:", resultado);

  }, [sport_type, reqValue, reqDist]);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formInner}>
        <h2 className={styles.title}>Crear Nuevo Equipo</h2>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.inputGroup}>
          <label htmlFor="team_name">Nombre del Equipo</label>
          <input
            className={styles.inputFull}
            type="text"
            id="team_name"
            value={team_name}
            onChange={(e) => setTeamName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Descripción</label>
          <textarea
            className={styles.textareaFull}
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="sport_type">Deporte</label>
          <div className={styles.inputGroup}>
          <select
            id="sport_type"
            value={sport_type}
            onChange={(e) => setSportType(e.target.value)}
            required
            className={styles.selectFull}
          >
            <option value="">Deporte del equipo</option>
            <option value="running">Running</option>
            <option value="cycling">Cycling</option>
          </select>
        </div>

        {sport_type === 'running' && (
          <>
            <div className={styles.inputGroup}>
              <label htmlFor="runPaceRequirement">Ritmo promedio de entrenamientos (min/km)</label>
              <input
                className={styles.inputFull}
                type="number"
                id="runPaceRequirement"
                value={runPaceRequirement}
                onChange={(e) => setRunPaceRequirement(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="runDistRequirement">Distancia promedio de entrenamientos (km)</label>
              <input
                className={styles.inputFull}
                type="number"
                id="runDistRequirement"
                value={runDistRequirement}
                onChange={(e) => setRunDistRequirement(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {sport_type === 'cycling' && (
          <>
            <div className={styles.inputGroup}>
              <label htmlFor="cyclePaceRequirement">Velocidad promedio de entrenamientos (km/h)</label>
              <input
                className={styles.inputFull}
                type="number"
                id="cyclePaceRequirement"
                value={cycleSpeedRequirement}
                onChange={(e) => setCycleSpeedRequirement(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="cycleDistRequirement">Distancia promedio de entrenamientos (km)</label>
              <input
                className={styles.inputFull}
                type="number"
                id="cycleDistRequirement"
                value={cycleDistRequirement}
                onChange={(e) => setCycleDistRequirement(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </>
        )}
        </div>

        {!creatorStatus.valid && (
        <div style={{ padding: 10, backgroundColor: '#ffe6e6', color: '#d00', borderRadius: 5, fontSize: '0.9em', marginTop: 10 }}>
          ⚠️ <strong>No puedes crear este equipo:</strong> {creatorStatus.msg}
        </div>
      )}

        <div className={styles.inputGroup}>
          <label htmlFor="team_color">Color del equipo</label>
          <input
            className={styles.inputFull}
            type="color"
            id="team_color"
            value={team_color}
            onChange={(e) => setTeamColor(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="teamImageFile">Logo del Equipo</label>
          <input type="file" accept="image/*" onChange={onSelectFile} />
        </div>

        {!!imgSrc && (
          <div className={styles.cropContainer}>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                onLoad={onImageLoad}
                className={styles.cropImage}
              />
            </ReactCrop>

            <button
              type="button"
              onClick={handleSaveCrop}
              className={styles.saveCropButton}
            >
              Confirmar Recorte
            </button>
          </div>
        )}

        {!!previewUrl && !imgSrc && (
          <div className={styles.previewContainer}>
            <p>Imagen seleccionada:</p>
            <img
              src={previewUrl}
              alt="Vista previa"
              className={styles.previewImage}
            />
            <button
              type="button"
              onClick={() => setImgSrc(previewUrl)}
              className={styles.editButton}
            >
              Editar
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className={styles.hiddenCanvas} />

        <div className={styles.buttonContainer}>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.buttonBase} ${styles.cancelButton}`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.buttonBase} ${styles.submitButton}`}
            disabled={isLoading || !creatorStatus.valid}
            style={{ opacity: !creatorStatus.valid ? 0.5 : 1 }}
          >
            {isLoading ? "Creando..." : "Crear Equipo"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateTeamForm;
