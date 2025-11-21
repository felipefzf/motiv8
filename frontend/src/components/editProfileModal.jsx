<<<<<<< Updated upstream
import React, { useState, useEffect } from "react";
import Modal from "./modal"; // Tu componente Modal genérico
import { useAuth } from "../context/authContext";
import styles from "./CreateTeamForm.module.css"; // Reutilizamos estilos
import { regionesYcomunas } from "../utils/funcionUtils";
=======
import React, { useState, useEffect } from 'react';
import Modal from './modal'; // Tu componente Modal genérico
import { useAuth } from '../context/authContext';
import styles from './CreateTeamForm.module.css'; // Reutilizamos estilos del form
import API_URL from '../config'; 
>>>>>>> Stashed changes


function EditProfileInfoModal({ isOpen, onClose, showToast  }) {
  const { user, refreshUser } = useAuth();

  // Estados para los campos
  const [name, setName] = useState("");
  const [comuna, setComuna] = useState("");
  const [region, setRegion] = useState("");
  const [mainSport, setMainSport] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  
  // Cargar datos del usuario al abrir el modal
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || "");
      setComuna(user.comuna || "");
      setRegion(user.region || "");
      setMainSport(user.main_sport || "");
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const token = localStorage.getItem("firebaseToken");
    if (!token) return;

    try {
<<<<<<< Updated upstream
      const response = await fetch("/api/users/profile", {
        method: "PUT", // Usamos PUT para actualizaciones
        headers: {
          "Content-Type": "application/json", // Enviamos JSON
          Authorization: `Bearer ${token}`,
=======
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT', // Usamos PUT para actualizaciones
        headers: { 
          'Content-Type': 'application/json', // Enviamos JSON
          'Authorization': `Bearer ${token}` 
>>>>>>> Stashed changes
        },
        body: JSON.stringify({
          name,
          comuna,
          region,
          main_sport: mainSport,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }

      // Éxito
      await refreshUser(); // Actualiza el contexto
      onClose(); // Cierra el modal
      showToast("Perfil actualizado correctamente");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Editar Perfil</h2>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.inputGroup}>
          <label>Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
  <label>Región</label>
  <select
    value={region}
    onChange={(e) => {
      setRegion(e.target.value);
      setComuna(''); // reset comuna al cambiar región
    }}
    required
  >
    <option value="">Selecciona una región...</option>
    {regionesYcomunas.map((r) => (
      <option key={r.region} value={r.region}>{r.region}</option>
    ))}
  </select>
</div>

<div className={styles.inputGroup}>
  <label>Comuna</label>
  <select
    value={comuna}
    onChange={(e) => setComuna(e.target.value)}
    required
    disabled={!region}
  >
    <option value="">Selecciona una comuna...</option>
    {region &&
      regionesYcomunas
        .find((r) => r.region === region)
        ?.comunas.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
  </select>
</div>


        <div className={styles.inputGroup}>
          <label>Deporte Principal</label>
          <select
            value={mainSport}
            onChange={(e) => setMainSport(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Selecciona...</option>
            <option value="Ciclismo">Ciclismo</option>
            <option value="Running">Running</option>
            <option value="Natación">Natación</option>
            <option value="Gimnasio">Gimnasio</option>
          </select>
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
    
  );
}

export default EditProfileInfoModal;
