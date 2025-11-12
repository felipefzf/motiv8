import { useEffect, useState } from "react";
import axios from "axios";
import "./Rankings.css";

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("nivel"); // Filtro por defecto
  const [subtitle, setSubtitle] = useState("🏆 Ranking Global por Nivel");

  // Mapea el nombre del filtro a un subtítulo legible
  const filterTitles = {
    nivel: "🏆 Ranking Global por Nivel",
    puntos: "🔥 Ranking por Puntos Totales",
    consistencia: "💪 Ranking por Consistencia",
  };

  // Obtiene el ranking filtrado desde el backend o lo ordena localmente
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/ranking?filter=${filter}`);
        setRanking(res.data);
      } catch (error) {
        console.error("Error obteniendo ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [filter]);

  // Actualiza subtítulo cuando cambia el filtro
  useEffect(() => {
    setSubtitle(filterTitles[filter] || "🏆 Ranking Global");
  }, [filter]);

  return (
    <div className="ranking-container">
      <h1 className="ranking-title">MOTIV8</h1>
      <h3 className="ranking-subtitle">{subtitle}</h3>

      {/* Selector de filtro */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="filter" style={{ marginRight: "10px", fontWeight: "bold" }}>
          Filtrar por:
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            backgroundColor: "var(--card-bg)",
            color: "var(--text-color)",
            border: "1px solid var(--accent-color)",
            fontWeight: "bold",
          }}
        >
          <option value="nivel">Nivel</option>
          <option value="puntos">Puntos</option>
          <option value="consistencia">Consistencia</option>
        </select>
      </div>

      <div className="ranking-list">
        {loading ? (
          <p>Cargando ranking...</p>
        ) : ranking.length === 0 ? (
          <p>No hay usuarios en el ranking.</p>
        ) : (
          <ul>
            {ranking.map((user, index) => (
              <li key={user.uid}>
                <strong>#{index + 1}</strong> {user.name}{" "}
                {filter === "nivel" && <>| Nivel: {user.nivel}</>}
                {filter === "puntos" && <>| Puntos: {user.puntos}</>}
                {filter === "consistencia" && <>| Consistencia: {user.consistencia}%</>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Ranking;
