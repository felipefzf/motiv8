<<<<<<< Updated upstream
// src/utils.js

/**
 * Convierte la distancia (en metros) a kilómetros con un decimal.
 * Ejemplo: 25432.5 → "25.4 km"
 */
export function formatDistance(activity) {
  const distanceInKm = activity.distance / 1000;
  return `${distanceInKm.toFixed(1)} km`;
}

/**
 * Convierte el tiempo (en segundos) a formato "1h 02min" o "45min".
 * Ejemplo: 3720 → "1h 02min"
 */
export function formatMovingTime(activity) {
  const totalSeconds = activity.moving_time;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
}

=======
// src/utils/stravaUtils.js
export function formatDistance(activity) {
  const km = (activity.distance || 0) / 1000;
  return `${km.toFixed(1)} km`;
}

export function formatMovingTime(activity) {
  const totalSeconds = activity.moving_time || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, "0")}min`
    : `${minutes}min`;
}
>>>>>>> Stashed changes
