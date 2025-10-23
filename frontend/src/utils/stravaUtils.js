
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

export async function getComunaFromGeoapify(lat, lng) {
  const apiKey = '8e6613c9028d433cb7b81f5622af46da';
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const props = data.features[0]?.properties;

    // Priorizar comuna (municipality), luego ciudad
    const comuna =
      props?.municipality ||
      props?.city ||
      props?.suburb ||
      "Comuna desconocida";

    return comuna;
  } catch (error) {
    console.error("Error al obtener comuna desde Geoapify:", error);
    return "Error al obtener comuna";
  }
}
