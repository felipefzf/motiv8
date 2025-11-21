import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// 1. Importa el archivo de estilos de CSS Modules
import styles from "./AdminDashboard.module.css";
import API_URL from '../config'; 


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

const initialItemState = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  type: "",
  durationMin: "",
};

function AdminDashboard() {
  const [missions, setMissions] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [itemForm, setItemForm] = useState(initialItemState);
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

  const fetchItems = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/shop/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error("Error cargando ítems:", err);
    }
  };

  const fetchMissions = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/missions`, {
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
    fetchItems();
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
      const response = await fetch(`${API_URL}${url}`, {
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
      const response = await fetch(`${API_URL}/api/missions/${id}`, {
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

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    await fetch(`${API_URL}/api/shop/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(itemForm),
    });
    setItemForm(initialItemState);
    fetchItems();
  };

  const handleItemChange = (e) => {
    const { name, value, type } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  // --- 6. RENDERIZADO DEL COMPONENTE (con 'className' en lugar de 'style') ---
  return (
    <div className={styles.container}>
      <h1>Panel administrador Ítems de la Tienda</h1>

      {/* --- FORMULARIO DE ÍTEMS DE TIENDA --- */}
      <form onSubmit={handleItemSubmit} className={styles.form}>
        <h3>Crear Ítem</h3>
        <input
          name="name"
          placeholder="Nombre"
          value={itemForm.name}
          onChange={handleItemChange}
          required
        />
        <textarea
          name="description"
          placeholder="Descripción"
          value={itemForm.description}
          onChange={handleItemChange}
          required
        />
        <input
          name="price"
          type="number"
          placeholder="Precio en coins"
          value={itemForm.price}
          onChange={handleItemChange}
          required
        />
        <input
          name="imageUrl"
          placeholder="URL de imagen"
          value={itemForm.imageUrl}
          onChange={handleItemChange}
        />
        <select
          name="type"
          value={itemForm.type}
          onChange={handleItemChange}
          required
        >
          <option value="">Tipo de ítem</option>
          <option value="xp_boost">Boost de XP</option>
          <option value="coin_boost">Boost de Coins</option>
          <option value="discount">Cupón de descuento</option>
        </select>
        <input
          name="durationMin"
          type="number"
          placeholder="Duración (min)"
          value={itemForm.durationMin}
          onChange={handleItemChange}
        />
        <button className={styles.createButton} type="submit">Crear Ítem</button>
      </form>

      <h2>Ítems de Tienda</h2>
      <ul className={styles.list}>
        {items.map((i) => (
          <li key={i.id} className={styles.listItem}>
            {i.name} - {i.price} Coins ({i.type})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;
