// frontend/src/MissionList.jsx
import React, { useState, useEffect } from 'react';

function MissionList() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await fetch('http://localhost:5000/missions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMissions(data);
      } catch (e) {
        setError("Error al cargar las misiones: " + e.message);
        console.error("Fetch missions error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []); // El array vacío asegura que se ejecuta solo una vez al montar

  if (loading) {
    return <p style={{ textAlign: 'center', margin: '20px' }}>Cargando misiones...</p>;
  }

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center', margin: '20px' }}>{error}</p>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Misiones Disponibles</h2>
      {missions.length === 0 ? (
        <p>No hay misiones creadas aún.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {missions.map(mission => (
            <li key={mission.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0', marginBottom: '10px' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#0056b3' }}>{mission.name}</h3>
              <p style={{ margin: '0 0 5px 0' }}><strong>Descripción:</strong> {mission.description}</p>
              <p style={{ margin: '0 0 5px 0' }}><strong>Objetivo:</strong> {mission.targetValue} {mission.unit} ({mission.type})</p>
              <p style={{ margin: '0 0 5px 0' }}><strong>Recompensa:</strong> {mission.reward}</p>
              {mission.startDate && <p style={{ margin: '0 0 5px 0' }}><strong>Inicio:</strong> {mission.startDate}</p>}
              {mission.endDate && <p style={{ margin: '0 0 5px 0' }}><strong>Fin:</strong> {mission.endDate}</p>}
              <p style={{ margin: '0', fontSize: '0.9em', color: '#666' }}>ID: {mission.id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MissionList;
