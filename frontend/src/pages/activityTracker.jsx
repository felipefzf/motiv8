import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import haversineDistance from '../utils/haversineDistance'; // Crearemos este archivo
import ActivityMap from '../components/activityMap';



function ActivityTracker() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);

  // Datos en vivo
  const [elapsedTime, setElapsedTime] = useState(0); // en segundos
  const [distance, setDistance] = useState(0); // en km
  const [currentSpeed, setCurrentSpeed] = useState(0); // en km/h
  const [maxSpeed, setMaxSpeed] = useState(0); // en km/h

  // Datos para guardar
  const [path, setPath] = useState([]); // Array de { lat, lng }

  const [initialPosition, setInitialPosition] = useState(null);
  
  const startTimeRef = useRef(null);
  const watchIdRef = useRef(null);
  const intervalIdRef = useRef(null);

    useEffect(() => {
        // Pedir la ubicación actual solo para centrar el mapa
        navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setInitialPosition({ lat: latitude, lng: longitude });
        },
        (err) => {
            // No es un error fatal, solo no podremos centrar el mapa.
            console.warn(`Error al obtener ubicación inicial: ${err.message}`);
        },
        { enableHighAccuracy: true }
        );
    }, []); // El array vacío [] asegura que solo se ejecute al montar


  // --- Funciones de Seguimiento ---
  const handlePositionUpdate = (position) => {
    const { latitude, longitude, speed } = position.coords;
    const newPoint = { lat: latitude, lng: longitude };
    
    // 1. Calcular Velocidad (speed viene en m/s, convertir a km/h)
    const newSpeedKmH = (speed || 0) * 3.6;
    setCurrentSpeed(newSpeedKmH);
    if (newSpeedKmH > maxSpeed) {
      setMaxSpeed(newSpeedKmH);
    }

    // 2. Calcular Distancia (usando Haversine)
    setPath((prevPath) => {

      const pathStart = prevPath.length === 0 && initialPosition ? [initialPosition] : prevPath;
      if (pathStart.length > 0) {
        const lastPoint = pathStart[pathStart.length - 1];
        const newDistance = haversineDistance(lastPoint, newPoint); // Distancia en km
        setDistance((prevDistance) => prevDistance + newDistance);
      }
      return [...prevPath, newPoint];
    });
  };

  const handlePositionError = (err) => {
    setError(`Error de GPS: ${err.message}. Asegúrate de dar permisos.`);
    stopTracking(); // Detener si hay un error
  };

  const startTracking = () => {
    // Pedir permiso primero
    navigator.geolocation.getCurrentPosition(
      () => {
        // Éxito, reiniciar estados
        setPath([]);
        setDistance(0);
        setCurrentSpeed(0);
        setMaxSpeed(0);
        setElapsedTime(0);
        setError(null);
        startTimeRef.current = Date.now();
        setIsTracking(true);

        // Iniciar el "watcher" de GPS
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handlePositionError,
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        // Iniciar el cronómetro
        intervalIdRef.current = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
      },
      (err) => {
        setError(`PERMISO DENEGADO: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  // Usamos useCallback para que 'stopTracking' sea estable
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    
    // Detener watchers e intervalos
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Guardar la actividad (si hay datos)
    if (path.length > 1 && distance > 0) {
      const avgSpeed = (distance / (elapsedTime / 3600)) || 0; // km/h
      
      const activityData = {
        path: path,
        distance: distance, // km
        time: elapsedTime, // segundos
        avgSpeed: avgSpeed, // km/h
        maxSpeed: maxSpeed, // km/h
      };
      
      console.log("Actividad guardada:", activityData);
      saveActivityToBackend(activityData);
    }
  }, [path, distance, elapsedTime, maxSpeed]); // Dependencias para la función

  // Limpieza: Asegura que el watcher se detenga si el usuario sale de la página
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // --- Función de Guardado ---
  const saveActivityToBackend = async (activityData) => {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      setError("No autenticado. No se pudo guardar.");
      return;
    }

    try {
      const response = await fetch('/api/activities', { // Ruta del Backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(activityData)
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      alert("¡Actividad guardada con éxito!");
    } catch (err) {
      setError(`Error al guardar: ${err.message}`);
    }
  };

  // --- Renderizado del Componente ---
  return (
    <div style={{ padding: '20px' }}>
      <h2>Nueva Actividad</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={styles.statsContainer}>
        <div style={styles.statBox}>
          <div>Distancia</div>
          <span>{distance.toFixed(2)}</span> km
        </div>
        <div style={styles.statBox}>
          <div>Tiempo</div>
          <span>{new Date(elapsedTime * 1000).toISOString().substr(11, 8)}</span>
        </div>
        <div style={styles.statBox}>
          <div>Veloc. Actual</div>
          <span>{currentSpeed.toFixed(1)}</span> km/h
        </div>
        <div style={styles.statBox}>
          <div>Veloc. Máx</div>
          <span>{maxSpeed.toFixed(1)}</span> km/h
        </div>
      </div>
      
      {!isTracking ? (
        <button onClick={startTracking} style={styles.startButton}>
          Iniciar
        </button>
      ) : (
        <button onClick={stopTracking} style={styles.stopButton}>
          Detener y Guardar
        </button>
      )}
      
      {/* Aquí es donde iría el mapa */}
      <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
        <ActivityMap path={path} initialPosition={initialPosition} />
      </div>
    </div>
  );
}

// Estilos rápidos (puedes moverlos a un CSS Module)
const styles = {
  statsContainer: { display: 'flex', justifyContent: 'space-around', margin: '20px 0' },
  statBox: { textAlign: 'center' },
  startButton: { width: '100%', padding: '15px', fontSize: '1.2rem', background: 'green', color: 'white', border: 'none', borderRadius: '8px' },
  stopButton: { width: '100%', padding: '15px', fontSize: '1.2rem', background: 'red', color: 'white', border: 'none', borderRadius: '8px' },
};

export default ActivityTracker;