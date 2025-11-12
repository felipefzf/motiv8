import { useEffect, useState } from "react";
import axios from "axios";


const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/ranking");
        setRanking(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error obteniendo ranking:", error);
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  return (
    <div className="ranking-container">
      <h1 className="ranking-title">🏆 Ranking Global</h1>
      <h3 className="ranking-subtitle">Ordenado por nivel más alto</h3>

      <div className="ranking-list">
        {loading ? (
          <p>Cargando ranking...</p>
        ) : ranking.length === 0 ? (
          <p>No hay usuarios en el ranking.</p>
        ) : (
          <ul>
            {ranking.map((user, index) => (
              <li key={user.uid}>
                <strong>#{index + 1}</strong> {user.name} | Nivel: {user.nivel} 
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Ranking;