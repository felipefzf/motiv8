import { useEffect, useState } from "react";
import "./Shop.css";
import { useAuth } from "../context/authContext";
import axios from "axios";
import API_URL from "../config";
import LiveToast from "../components/liveToast";
import Header from "../components/Header"; // 👈 IMPORTANTE

// Imágenes locales de fallback (si no hay imageUrl en el ítem)
import boostImg from "../assets/boost.png";
import cuponImg from "../assets/cupon.png";
import coinsImg from "../assets/coins.png";

export default function Shop() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  useEffect(() => {
    if (!token) return;

    const fetchItems = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/shop/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);
      } catch (err) {
        console.error("Error cargando ítems de tienda:", err);
      }
    };

    fetchItems();
  }, [token]);

  const handlePurchase = async (item) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/shop/purchase`,
        { itemName: item.name, cost: item.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(`✅ ${res.data.message}`);
    } catch (err) {
      if (err.response?.status === 400) {
        showToast(`⚠️ ${err.response.data.message}`);
      } else {
        showToast("❌ Error al procesar la compra.");
      }
    }
  };

  // Fallback de imágenes según tipo
  const getImage = (item) => {
    if (item.imageUrl) return item.imageUrl;
    if (item.type === "xp_boost") return boostImg;
    if (item.type === "discount") return cuponImg;
    if (item.type === "coin_boost") return coinsImg;
    return coinsImg;
  };

  return (
    <div className="shop-page-with-header">
      {/* 🔹 HEADER FIJO */}
      <Header title="Tienda" />

      {/* 🔹 CONTENIDO DE LA TIENDA DEBAJO DEL HEADER */}
      <div className="shop-container">
        <div className="shop-grid">
          {items.map((item) => (
            <div className="card-shop" key={item.id}>
              <img src={getImage(item)} className="card-img" alt={item.name} />
              <div className="card-body">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-description">{item.description}</p>
                <p className="card-description">{item.price} Coins</p>
                <button
                  className="btn-comprar"
                  onClick={() => handlePurchase(item)}
                >
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>

        {toastMessage && <LiveToast key={toastKey} message={toastMessage} />}
      </div>
    </div>
  );
}
