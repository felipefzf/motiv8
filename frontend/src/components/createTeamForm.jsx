import React, { useState, useRef } from "react";
import { useAuth } from "../context/authContext";
import styles from "./CreateTeamForm.module.css";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import LiveToast from "../components/liveToast";

import { canvasPreview, getCanvasBlob } from "../utils/canvasPreview";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%", // porcentaje
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

    const token = localStorage.getItem("firebaseToken");
    if (!token) {
      setIsLoading(false);
      setError("No autenticado.");
      return;
    }

    const formData = new FormData();
    formData.append("team_name", team_name);
    formData.append("sport_type", sport_type);
    formData.append("description", description);
    formData.append("team_color", team_color);

    if (blobToSend) {
      formData.append("teamImageFile", blobToSend, "logo.jpg");
    }

    try {
      const response = await fetch("/api/teams", {
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

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
          showToast
          className={styles.cancelButton}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? "Creando..." : "Crear Equipo"}
        </button>
      </div>
    </form>
  );
}

export default CreateTeamForm;
