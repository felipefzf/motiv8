// Función auxiliar para convertir grados a radianes
function toRad(x) {
  return x * Math.PI / 180;
}

/**
 * Calcula la distancia en km entre dos puntos de coordenadas (lat, lng)
 * @param {object} p1 - Primer punto { lat, lng }
 * @param {object} p2 - Segundo punto { lat, lng }
 * @returns {number} - Distancia en kilómetros
 */
function haversineDistance(p1, p2) {
  const R = 6371; // Radio de la Tierra en km

  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distancia en km
}

export default haversineDistance;