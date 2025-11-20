// src/pages/ActivityTracker.jsx

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ActivityMap from '../components/ActivityMap';
// import styles from './ActivityTracker.module.css'; // (Crea este archivo o usa inline)

function ActivityTracker() {
  const { user } = useAuth();
  
  // Estados de la Actividad
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'finished'
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Segundos
  const [activityType, setActivityType] = useState('Running');
  const [title, setTitle] = useState('');
  
  // Datos Geográficos
  const [startPos, setStartPos] = useState(null);
  const [endPos, setEndPos] = useState(null);
  const [routeData, setRouteData] = useState(null); // Aquí guardamos lo que nos da OSRM
  
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const timerRef = useRef(null);

  // --- 1. INICIAR ACTIVIDAD ---
  const handleStart = () => {
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setStartPos(coords);
        setStartTime(Date.now());
        setStatus('running');
        
        // Iniciar Cronómetro Visual
        timerRef.current = setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
      },
      (err) => setError("Error al obtener ubicación inicial. Activa el GPS."),
      { enableHighAccuracy: true }
    );
  };

  // --- 2. TERMINAR ACTIVIDAD Y CALCULAR RUTA ---
  const handleStop = () => {
    // Detener cronómetro
    clearInterval(timerRef.current);
    const finalTime = Math.floor((Date.now() - startTime) / 1000);
    setElapsedTime(finalTime);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setEndPos(coords);
        setStatus('finished');
        
        // ¡LA MAGIA! Calcular ruta con OSRM
        await calculateRoute(startPos, coords);
      },
      (err) => setError("Error al obtener ubicación final.")
    );
  };

  // --- 3. CONEXIÓN CON OSRM (Servicio de Rutas) ---
  const calculateRoute = async (start, end) => {
    try {
      // OSRM usa formato: longitud,latitud (al revés que Google/Leaflet)
      const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok') throw new Error('No se pudo calcular la ruta');

      const route = data.routes[0];
      
      setRouteData({
        distanceKm: route.distance / 1000, // OSRM devuelve metros
        geometry: route.geometry, // Esto es el dibujo del mapa (GeoJSON)
        duration: route.duration // Estimado de OSRM (no lo usamos, usamos tu cronómetro)
      });

    } catch (e) {
      setError("Error calculando la ruta: " + e.message);
    }
  };

  // --- 4. GUARDAR EN BASE DE DATOS ---
  const handleSave = async () => {
    if (!routeData) return;
    setIsSaving(true);

    const token = localStorage.getItem('firebaseToken');
    const avgSpeed = (routeData.distanceKm / (elapsedTime / 3600)); // km/h

    const defaultTitle = `${activityType} - ${new Date().toLocaleDateString()}`;
    const finalTitle = title.trim() === '' ? defaultTitle : title;

    const activityPayload = {
      title: finalTitle,
      type: activityType, // O podrías poner un selector
      distance: routeData.distanceKm,
      time: elapsedTime, // segundos
      avgSpeed: avgSpeed,
      path: routeData.geometry.coordinates, // Guardamos el array de coordenadas de OSRM
      date: new Date().toISOString(),
      startLocation: startPos,
      endLocation: endPos
    };

    try {
      // (Asegúrate de usar tu URL de producción o local según corresponda)
      // Para producción, usa import.meta.env.VITE_API_URL o ruta relativa si están en el mismo dominio
      const response = await fetch('/api/activities', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(activityPayload)
      });

      if (!response.ok) throw new Error("Error al guardar en servidor");
      
      alert("¡Actividad guardada con éxito!");
      // Reiniciar todo
      setStatus('idle');
      setStartPos(null);
      setEndPos(null);
      setRouteData(null);
      setElapsedTime(0);
      setTitle('');

    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Formato de tiempo (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Registrar Actividad</h2>
      {status === 'idle' && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Elige tu deporte:</label>
          <select 
            value={activityType} 
            onChange={(e) => setActivityType(e.target.value)}
            style={{ padding: '10px', fontSize: '1rem', borderRadius: '5px' }}
          >
            <option value="Running">🏃‍♂️ Correr</option>
            <option value="Cycling">🚴‍♀️ Ciclismo</option>
            <option value="Walking">🚶 Caminata</option>
          </select>
        </div>
      )}

      {/* Muestra el deporte elegido mientras corre */}
      {status !== 'idle' && (
        <div style={{ textAlign: 'center', marginBottom: '10px', color: '#666' }}>
          Actividad: <strong>{activityType === 'Running' ? 'Corriendo' : activityType === 'Cycling' ? 'Ciclismo' : 'Caminata'}</strong>
        </div>
      )}
      
      {/* Cronómetro Gigante */}
      <div style={{ fontSize: '3rem', textAlign: 'center', margin: '20px 0', fontFamily: 'monospace' }}>
        {formatTime(elapsedTime)}
      </div>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {/* Botones de Control */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        {status === 'idle' && (
          <button onClick={handleStart} style={{ padding: '15px 30px', fontSize: '1.2rem', background: 'green', color: 'white', border: 'none', borderRadius: '50px' }}>
            ▶ Iniciar
          </button>
        )}

        {status === 'running' && (
          <button onClick={handleStop} style={{ padding: '15px 30px', fontSize: '1.2rem', background: 'red', color: 'white', border: 'none', borderRadius: '50px' }}>
            ⏹ Terminar
          </button>
        )}
      </div>

      {/* Resumen Final y Mapa */}
      {status === 'finished' && routeData && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: '#f9f9f9' }}>
          <h3>Resumen de Actividad</h3>
          
          {/* --- 3. AQUÍ AGREGAMOS EL INPUT DEL TÍTULO --- */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              Nombre de la actividad:
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder={`Ej: ${activityType} por el parque`}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: '1px solid #ccc',
                fontSize: '1rem'
              }} 
            />
          </div>
          {/* --------------------------------------------- */}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
             <p><strong>Distancia:</strong> {routeData.distanceKm.toFixed(2)} km</p>
             <p><strong>Ritmo:</strong> {(routeData.distanceKm / (elapsedTime/3600)).toFixed(1)} km/h</p>
          </div>
          {/* Mapa de Resultados */}
          <div style={{ height: '250px', margin: '15px 0' }}>
             <ActivityMap 
                start={startPos} 
                end={endPos} 
                routeGeoJSON={routeData.geometry} 
             />
          </div>

          <button onClick={handleSave} disabled={isSaving} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
            {isSaving ? 'Guardando...' : '💾 Guardar Actividad'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityTracker;