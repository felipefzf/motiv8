import React, { useState } from 'react';
import API_URL from '../config'; 

function MissionCreator() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('distance'); // Valor por defecto
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('meters'); // Valor por defecto
  const [reward, setReward] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    // Validar que el token esté presente
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      setIsError(true);
      setMessage('No se ha encontrado un token de autenticación. Por favor, inicia sesión.');
      return;
    }

    const missionData = {
      name,
      description,
      type,
      targetValue: parseFloat(targetValue), // Convertir a número flotante
      unit,
      reward,
      startDate,
      endDate
    };

    try {
      const response = await fetch(`${API_URL}/api/missions`, { // URL a tu backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Incluir el token en el encabezado
        },
        body: JSON.stringify(missionData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`¡Misión creada con éxito! ID: ${data.id}`);
        // Limpiar formulario
        setName('');
        setDescription('');
        setType('distance');
        setTargetValue('');
        setUnit('meters');
        setReward('');
        setStartDate('');
        setEndDate('');
      } else {
        setIsError(true);
        setMessage(`Error al crear misión: ${data.error}`);
      }
    } catch (error) {
      setIsError(true);
      setMessage(`Error de conexión al servidor: ${error.message}`);
      console.error('Error de red:', error);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',color: '#fff' }}>
      <h2>Crear Nueva Misión</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label htmlFor="name">Nombre de la Misión:</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="description">Descripción:</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="3"></textarea>
        </div>
        <div>
          <label htmlFor="type">Tipo de Objetivo:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="distance">Distancia</option>
            <option value="time">Tiempo</option>
            <option value="elevation_gain">Desnivel</option>
            <option value="activities_count">Número de Actividades</option>
          </select>
        </div>
        <div>
          <label htmlFor="targetValue">Valor Objetivo:</label>
          <input type="number" id="targetValue" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required step="any" />
        </div>
        <div>
          <label htmlFor="unit">Unidad:</label>
          <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} required>
            <option value="meters">Metros</option>
            <option value="seconds">Segundos</option>
            <option value="count">Conteo</option>
            <option value="meters_elevation">Metros (Desnivel)</option>
          </select>
        </div>
        <div>
          <label htmlFor="reward">Recompensa:</label>
          <input type="text" id="reward" value={reward} onChange={(e) => setReward(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="startDate">Fecha de Inicio (Opcional):</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="endDate">Fecha de Fin (Opcional):</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div style={{ gridColumn: 'span 2', textAlign: 'center' }}>
          <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            Crear Misión
          </button>
        </div>
      </form>
      {message && (
        <p style={{ marginTop: '20px', padding: '10px', borderRadius: '4px', backgroundColor: isError ? '#ffe0e0' : '#e0ffe0', color: isError ? '#cc0000' : '#007200', border: `1px solid ${isError ? '#cc0000' : '#007200'}` }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default MissionCreator;
