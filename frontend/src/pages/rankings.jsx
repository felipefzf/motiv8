import { useEffect, useState } from "react";
import axios from "axios";
import "./Rankings.css";

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("nivel"); // Filtro por defecto

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/ranking");
        setRanking(res.data);
      } catch (error) {
        console.error("Error obteniendo ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  // Ordenar según el filtro
  const getFilteredRanking = () => {
    return [...ranking].sort((a, b) => (b[filter] ?? 0) - (a[filter] ?? 0));
  };

  return (
    <div className="ranking-container">
      <h1 className="ranking-title">MOTIV8</h1>
      <h3 className="ranking-subtitle">🏆 Ranking Global</h3>

      {/* Selector de filtro */}
      <div className="ranking-filter">
        <label htmlFor="filter">Filtrar por:&nbsp;</label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="nivel">Nivel</option>
          <option value="misiones">Misiones</option>
          <option value="distancia">Distancia</option>
        </select>
      </div>

      <div className="ranking-list">
        {loading ? (
          <p>Cargando ranking...</p>
        ) : ranking.length === 0 ? (
          <p>No hay usuarios en el ranking.</p>
        ) : (
          <ul>
            {getFilteredRanking().map((user, index) => (
              <li key={user.uid} className="ranking-item">
                <div className="left-section">
                  <strong>#{index + 1}</strong> <span>{user.name}</span>
                </div>
                <div className="right-section">
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}:{" "}
                  <span className="value">{user[filter] ?? "N/A"}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Ranking;
