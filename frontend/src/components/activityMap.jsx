import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo de íconos (obligatorio en React Leaflet)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function ActivityMap({ start, end, routeGeoJSON }) {
  if (!start || !end) return <p>Cargando mapa...</p>;

  // Centrar el mapa entre los dos puntos (aprox)
  const centerLat = (start.lat + end.lat) / 2;
  const centerLng = (start.lng + end.lng) / 2;

  return (
    <MapContainer 
      center={[centerLat, centerLng]} 
      zoom={14} 
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* Marcador de Inicio */}
      <Marker position={[start.lat, start.lng]}>
        <Popup>Inicio</Popup>
      </Marker>

      {/* Marcador de Fin */}
      <Marker position={[end.lat, end.lng]}>
        <Popup>Fin</Popup>
      </Marker>

      {/* La Ruta (Línea Azul) */}
      {routeGeoJSON && (
        <GeoJSON 
          data={routeGeoJSON} 
          style={{ color: 'blue', weight: 5, opacity: 0.7 }} 
        />
      )}
    </MapContainer>
  );
}

export default ActivityMap;