import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "../context/authContext";
import styles from "./EditGoalsModal.module.css"; // 👈 nuevo CSS específico
import LiveToast from "../components/liveToast";

function EditGoalsModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  const [runPace, setRunPace] = useState("");
  const [runDist, setRunDist] = useState("");


  const [cycleSpeed, setCycleSpeed] = useState("");
  const [cycleDist, setCycleDist] = useState("");

  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);


  useEffect(() => {
    if (user && isOpen) {
      setRunPace(user.performance?.running?.pace || "");
      setRunDist(user.performance?.running?.distance || "");
      setCycleSpeed(user.performance?.cycling?.speed || "");
      setCycleDist(user.performance?.cycling?.distance || "");
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const token = localStorage.getItem("firebaseToken");
    if (!token) {
      setError("Error de autenticación");
      setIsLoading(false);
      return;
    }

    const performanceData = {
      running: {
        pace: runPace ? parseFloat(runPace) : null,
        distance: runDist ? parseFloat(runDist) : null,
      },
      cycling: {
        speed: cycleSpeed ? parseFloat(cycleSpeed) : null,
        distance: cycleDist ? parseFloat(cycleDist) : null,
      },
    };

    try {
      const response = await fetch("/api/users/goals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ performance: performanceData }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar las metas");
      }

      await refreshUser();
      setToastMessage("✅ ¡Metas actualizadas correctamente!");
      setToastKey((prev) => prev + 1);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <>
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Mis Metas y Rendimiento</h2>

        {error && <p className={styles.error}>{error}</p>}

  
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🏃‍♂️ Running</h3>

          <div className={styles.inputGroup}>
            <label>Ritmo promedio (min/km):</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ej. 5.30"
              value={runPace}
              onChange={(e) => setRunPace(e.target.value)}
            />
            <small className={styles.helpText}>
              Ej: 5.30 significa 5 minutos 30 segundos por km.
            </small>
          </div>

          <div className={styles.inputGroup}>
            <label>Distancia habitual (km):</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ej. 10"
              value={runDist}
              onChange={(e) => setRunDist(e.target.value)}
            />
          </div>
        </div>

 
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🚴‍♀️ Ciclismo</h3>

          <div className={styles.inputGroup}>
            <label>Velocidad promedio (km/h):</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ej. 25.5"
              value={cycleSpeed}
              onChange={(e) => setCycleSpeed(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Distancia habitual (km):</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ej. 40"
              value={cycleDist}
              onChange={(e) => setCycleDist(e.target.value)}
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
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </Modal> 
    
    <LiveToast key={toastKey} message={toastMessage} />
    </>
  );
}

export default EditGoalsModal;
