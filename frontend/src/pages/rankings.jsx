import { useEffect, useState } from "react";
import axios from "axios";
import "./Rankings.css";
import API_URL from "../config";

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [destacados, setDestacados] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("nivel"); // filtro por defecto
  const [comunaFilter, setComunaFilter] = useState(""); // filtro por comuna

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/ranking`, {
          params: { comuna: comunaFilter || undefined },
        });
        setRanking(res.data.usuarios);
        setComunas(res.data.comunasDisponibles);
        setDestacados(res.data.destacados);
      } catch (error) {
        console.error("Error obteniendo ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [comunaFilter]);

  // Ordenar según el filtro seleccionado
  const getFilteredRanking = () => {
    return [...ranking].sort((a, b) => (b[filter] ?? 0) - (a[filter] ?? 0));
  };

  return (
    <div className="ranking-container">
      <h1 className="ranking-title">MOTIV8</h1>
      <h3 className="ranking-subtitle">🏆 Ranking Global</h3>

      {/* Destacados */}
      {destacados && (
        <div className="destacados">
          <h4>Usuarios destacados</h4>
          <p>⭐ Máximo nivel: {destacados.maxNivel?.name} (Nivel {destacados.maxNivel?.nivel})</p>
          <p>🚴 Mayor distancia: {destacados.maxDistancia?.name} ({destacados.maxDistancia?.distancia} km)</p>
          <p>🎯 Más misiones: {destacados.maxMisiones?.name} ({destacados.maxMisiones?.misiones} misiones)</p>
        </div>
      )}

      {/* Selector de filtro */}
      <div className="ranking-filter">
        <label htmlFor="filter">Filtrar por:&nbsp;</label>
        <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="nivel">Nivel</option>
          <option value="misiones">Misiones</option>
          <option value="distancia">Distancia</option>
        </select>
      </div>

      {/* Selector de comuna */}
      <div className="ranking-filter">
        <label htmlFor="comuna">Comuna:&nbsp;</label>
        <select id="comuna" value={comunaFilter} onChange={(e) => setComunaFilter(e.target.value)}>
          <option value="">Todas</option>
          {comunas.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Lista de ranking */}
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
                  {user.comuna && <span className="comuna"> | {user.comuna}</span>}
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
