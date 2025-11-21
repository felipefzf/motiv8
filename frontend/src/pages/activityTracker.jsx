// src/pages/ActivityTracker.jsx

import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import ActivityMap from "../components/ActivityMap";
import "./ActivityTracker.css"; // 👈 usamos el CSS externo

function ActivityTracker() {
  const { user } = useAuth();

  const [status, setStatus] = useState("idle"); // 'idle' | 'running' | 'finished'
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activityType, setActivityType] = useState("Running");
  const [title, setTitle] = useState("");

  const [startPos, setStartPos] = useState(null);
  const [endPos, setEndPos] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef(null);

  const handleStart = () => {
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setStartPos(coords);
        setStartTime(Date.now());
        setStatus("running");

        timerRef.current = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);
      },
      () => setError("Error al obtener ubicación inicial. Activa el GPS."),
      { enableHighAccuracy: true }
    );
  };

  const handleStop = () => {
    clearInterval(timerRef.current);
    const finalTime = Math.floor((Date.now() - startTime) / 1000);
    setElapsedTime(finalTime);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setEndPos(coords);
        setStatus("finished");
        await calculateRoute(startPos, coords);
      },
      () => setError("Error al obtener ubicación final.")
    );
  };

  const calculateRoute = async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== "Ok") throw new Error("No se pudo calcular la ruta");

      const route = data.routes[0];

      setRouteData({
        distanceKm: route.distance / 1000,
        geometry: route.geometry,
        duration: route.duration,
      });
    } catch (e) {
      setError("Error calculando la ruta: " + e.message);
    }
  };

  const handleSave = async () => {
    if (!routeData) return;
    setIsSaving(true);

    const token = localStorage.getItem("firebaseToken");
    const avgSpeed = routeData.distanceKm / (elapsedTime / 3600);

    const defaultTitle = `${activityType} - ${new Date().toLocaleDateString()}`;
    const finalTitle = title.trim() === "" ? defaultTitle : title;

    const activityPayload = {
      title: finalTitle,
      type: activityType,
      distance: routeData.distanceKm,
      time: elapsedTime,
      avgSpeed: avgSpeed,
      path: routeData.geometry.coordinates,
      date: new Date().toISOString(),
      startLocation: startPos,
      endLocation: endPos,
    };

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(activityPayload),
      });

      if (!response.ok) throw new Error("Error al guardar en servidor");

      alert("¡Actividad guardada con éxito!");
      setStatus("idle");
      setStartPos(null);
      setEndPos(null);
      setRouteData(null);
      setElapsedTime(0);
      setTitle("");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="activity-container">
      <h1 className="activity-title">MOTIV8</h1>
      <h2 className="activity-subtitle">Registrar Actividad</h2>

      {status === "idle" && (
        <div className="activity-select-wrapper">
          <label className="activity-select-label">
            Elige tu deporte:
          </label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="activity-select"
          >
            <option value="Running">🏃‍♂️ Correr</option>
            <option value="Cycling">🚴‍♀️ Ciclismo</option>
            <option value="Walking">🚶 Caminata</option>
          </select>
        </div>
      )}

      {status !== "idle" && (
        <div className="activity-current">
          Actividad:{" "}
          <strong>
            {activityType === "Running"
              ? "Corriendo"
              : activityType === "Cycling"
              ? "Ciclismo"
              : "Caminata"}
          </strong>
        </div>
      )}

      <div className="activity-timer">
        {formatTime(elapsedTime)}
      </div>

      {error && <p className="activity-error">{error}</p>}

      <div className="activity-buttons">
        {status === "idle" && (
          <button
            onClick={handleStart}
            className="activity-btn activity-btn-start"
          >
            ▶ Iniciar
          </button>
        )}

        {status === "running" && (
          <button
            onClick={handleStop}
            className="activity-btn activity-btn-stop"
          >
            ⏹ Terminar
          </button>
        )}
      </div>

      {status === "finished" && routeData && (
        <div className="activity-summary">
          <h3>Resumen de Actividad</h3>

          <div className="activity-title-wrapper">
            <label className="activity-title-label">
              Nombre de la actividad:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Ej: ${activityType} por el parque`}
              className="activity-title-input"
            />
          </div>

          <div className="activity-summary-row">
            <p>
              <strong>Distancia:</strong>{" "}
              {routeData.distanceKm.toFixed(2)} km
            </p>
            <p>
              <strong>Ritmo:</strong>{" "}
              {(routeData.distanceKm / (elapsedTime / 3600)).toFixed(1)} km/h
            </p>
          </div>

          <div className="activity-map-wrapper">
            <ActivityMap
              start={startPos}
              end={endPos}
              routeGeoJSON={routeData.geometry}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="activity-btn-save"
          >
            {isSaving ? "Guardando..." : "💾 Guardar Actividad"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityTracker;
