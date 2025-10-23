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


export function translateActivityType(activity) {
  const type = activity?.type?.trim().toLowerCase();

  switch (type) {
    case 'ride':
      return 'Ciclismo';
    case 'run':
      return 'Correr';
    default:
      return activity.type;
  }
}
