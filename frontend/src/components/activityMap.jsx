import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';

function ActivityMap({ path, initialPosition }) {
  if (path.length === 0) {
    return <div style={{ height: '300px', background: '#eee', display: 'grid', placeItems: 'center' }}>Esperando datos GPS...</div>;
  }
  
  let center;
  let positions = [];
  let zoom = 16;

  if (path.length > 0) {
    // --- ESTADO 2: RASTREANDO ---
    // El 'path' tiene datos, dibuja la ruta
    positions = path.map(p => [p.lat, p.lng]);
    // Centra el mapa en el último punto
    center = positions[positions.length - 1];
  } else {
    // --- ESTADO 1: VISTA INICIAL ---
    // El 'path' está vacío, pero tenemos la 'initialPosition'
    center = [initialPosition.lat, initialPosition.lng];
    zoom = 15; // Un poco más alejado al inicio
  }

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} key={center.toString()}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Dibuja la línea de la ruta solo si hay posiciones */}
      {positions.length > 0 && (
        <Polyline positions={positions} color="blue" />
      )}
      
      {/* (Opcional) Poner un marcador en la posición actual/inicial */}
      <Marker position={center}>
        <Popup>
          {path.length > 0 ? "¡Aquí estás!" : "Punto de Inicio"}
        </Popup>
      </Marker>
      
    </MapContainer>
  );
}

export default ActivityMap;