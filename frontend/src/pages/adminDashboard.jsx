import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";
import API_URL from "../config";

const initialItemState = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  type: "",
  durationMin: "",
};

function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(initialItemState);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Helper para obtener token ---
  const getToken = () => {
    const token = localStorage.getItem("firebaseToken");
    if (!token) {
      navigate("/login");
      return null;
    }
    return token;
  };

  // --- Obtener Ítems ---
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
      setError("Error al cargar ítems de la tienda.");
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Crear Ítem ---
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/shop/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemForm),
      });

      if (!response.ok) {
        throw new Error("Error al crear el ítem.");
      }

      setItemForm(initialItemState);
      fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // --- Eliminar Ítem ---
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este ítem?")) {
      return;
    }

    setError(null);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/shop/items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        throw new Error(
          "Acción prohibida. No tienes permisos de administrador."
        );
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar el ítem.");
      }

      fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // --- Manejar cambios del formulario ---
  const handleItemChange = (e) => {
    const { name, value, type } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  return (
    <div className={styles.container}>
      <h1>Panel administrador Ítems de la Tienda</h1>
      <br />

      {error && <p className={styles.error}>{error}</p>}

      {/* --- Formulario Crear Ítem --- */}
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
        <button className={styles.createButton} type="submit">
          Crear Ítem
        </button>
      </form>

      <h2>Ítems de Tienda</h2>
      <ul className={styles.list}>
        {items.map((i) => (
          <li key={i.id} className={styles.listItem}>
            {i.name} - {i.price} Coins ({i.type})
            <div className={styles.listItemButtons}>
              <button
                onClick={() => handleDelete(i.id)}
                className={`${styles.button} ${styles.deleteButton}`}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;
