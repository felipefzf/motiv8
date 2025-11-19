import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// 1. Importa el archivo de estilos de CSS Modules
import styles from "./AdminDashboard.module.css";

// 2. El objeto 'styles' ya no existe aquí
// ...

// Estado inicial vacío para el formulario (esto se queda igual)
const initialState = {
  name: "",
  description: "",
  type: "distance",
  targetValue: 0,
  unit: "km",
  reward: 0,
  coinReward: 0,
  startDate: "",
  endDate: "",
};

function AdminDashboard() {
  const [missions, setMissions] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- TODA TU LÓGICA (getToken, fetchMissions, handleSubmit, etc.) ---
  // --- NO CAMBIA NADA AQUÍ. Cópiala y pégala tal cual ---
  // ... (toda la lógica de funciones va aquí) ...

  // --- 1. FUNCIÓN AUXILIAR PARA OBTENER EL TOKEN ---
  const getToken = () => {
    const token = localStorage.getItem("firebaseToken");
    if (!token) {
      navigate("/login");
    }
    return token;
  };

  // --- 2. READ (LEER) ---
  const fetchMissions = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch("/api/missions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("No autorizado. Vuelve a iniciar sesión.");
      }
      if (!response.ok) throw new Error("No se pudieron cargar las misiones.");

      const data = await response.json();
      setMissions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  // --- 3. CREATE / UPDATE (MANEJADOR DEL FORMULARIO) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) return;

    const isUpdating = editingId !== null;
    const url = isUpdating ? `/api/missions/${editingId}` : "/api/missions";
    const method = isUpdating ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 403) {
        throw new Error(
          "Acción prohibida. No tienes permisos de administrador."
        );
      }
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error ||
            `Error al ${isUpdating ? "actualizar" : "crear"} la misión.`
        );
      }

      setFormData(initialState);
      setEditingId(null);
      fetchMissions();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- 4. DELETE (ELIMINAR) ---
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta misión?")) {
      return;
    }

    setError(null);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/missions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        throw new Error(
          "Acción prohibida. No tienes permisos de administrador."
        );
      }
      if (!response.ok) throw new Error("Error al eliminar la misión.");

      fetchMissions();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- 5. FUNCIONES AUXILIARES DEL FORMULARIO ---
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleEditClick = (mission) => {
    setEditingId(mission.id);
    const formattedMission = {
      ...mission,
      startDate: mission.startDate ? mission.startDate.split("T")[0] : "",
      endDate: mission.endDate ? mission.endDate.split("T")[0] : "",
    };
    setFormData(formattedMission);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialState);
    setError(null);
  };

  // --- 6. RENDERIZADO DEL COMPONENTE (con 'className' en lugar de 'style') ---
  return (
    <div className={styles.container}>
      <h1>Panel de Administrador de Misiones</h1>

      {/* --- FORMULARIO DE CREAR / EDITAR --- */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3>{editingId ? "Actualizar Misión" : "Crear Nueva Misión"}</h3>

        {/* Usamos clases de utilidad para los estilos 'dinámicos' */}
        <div className={`${styles.inputGroup} ${styles.flex100}`}>
          <label>Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>
        <div className={`${styles.inputGroup} ${styles.flex100}`}>
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={styles.input}
          >
            <option value="distance">Distancia</option>
            <option value="time">Tiempo</option>
            <option value="calories">Calorías</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label>Objetivo (Valor)</label>
          <input
            type="number"
            name="targetValue"
            value={formData.targetValue}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Unidad (ej: km, min, kcal)</label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Recompensa (Puntos)</label>
          <input
            type="number"
            name="reward"
            value={formData.reward}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Recompensa (Coins)</label>
          <input
            type="number"
            name="coinReward"
            value={formData.coinReward}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Fecha de Inicio</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Fecha de Fin</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className={styles.input}
          />
        </div>

        {/* Para clases combinadas, usamos un template literal. 
          `${styles.baseClass} ${styles.modifierClass}` 
        */}
        <div
          className={`${styles.inputGroup} ${styles.flex100} ${styles.formActions}`}
        >
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={`${styles.button} ${
              editingId ? styles.updateButton : styles.createButton
            }`}
          >
            {editingId ? "Actualizar Misión" : "Crear Misión"}
          </button>
        </div>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {/* --- LISTA DE MISIONES --- */}
      <h2>Misiones Activas</h2>
      {loading ? (
        <p>Cargando misiones...</p>
      ) : (
        <ul className={styles.list}>
          {missions.map((mission) => (
            <li key={mission.id} className={styles.listItem}>
              <div>
                <strong>{mission.name}</strong> ({mission.type})
                <p>{mission.description}</p>
                <small>
                  Recompensa: {mission.reward} XP | {mission.coinReward} Coins |
                  Fin: {mission.endDate || "N/A"}
                </small>
              </div>
              <div className={styles.listItemButtons}>
                <button
                  onClick={() => handleEditClick(mission)}
                  className={`${styles.button} ${styles.editButton}`}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(mission.id)}
                  className={`${styles.button} ${styles.deleteButton}`}
                >
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
