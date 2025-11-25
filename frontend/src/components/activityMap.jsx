import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo de íconos (obligatorio en React Leaflet)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function ActivityMap({ path, routeGeoJSON, start, end, interactive = true }) {
  // Lógica para determinar qué mostrar
  // Prioridad 1: GeoJSON (Ruta calculada por OSRM)
  // Prioridad 2: Path (Array de puntos GPS crudos)

  let center = [0, 0];
  let zoom = 13;
  let positions = [];

  if (routeGeoJSON) {
    // Caso OSRM (GeoJSON)
    // Nota: GeoJSON usa [long, lat], Leaflet necesita [lat, long] para el centro
    // Pero el componente <GeoJSON /> maneja la data correctamente solo.
    if (start) center = [start.lat, start.lng];
  } else if (path && path.length > 0) {
    // Caso GPS Crudo (Array de objetos o arrays)
    // Normalizamos a [lat, lng]
    positions = path.map(p => p.lat ? [p.lat, p.lng] : [p[1], p[0]]); 
    center = positions[0]; 
  } else if (start) {
      center = [start.lat, start.lng];
  }

  if (!start && !path && !routeGeoJSON) return <div style={{height: '100%', background: '#eee', display: 'grid', placeItems: 'center', color: '#666'}}>Sin datos de mapa</div>;

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 0 }} // zIndex bajo para no tapar modales
      dragging={interactive} // Opción para hacer el mapa estático en el perfil
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      zoomControl={interactive}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />

      {/* Opción A: Ruta GeoJSON (OSRM) */}
      {routeGeoJSON && (
        <GeoJSON data={routeGeoJSON} style={{ color: 'blue', weight: 5, opacity: 0.7 }} />
      )}

      {/* Opción B: Ruta Manual (GPS Points) */}
      {!routeGeoJSON && positions.length > 0 && (
        <Polyline positions={positions} color="blue" weight={5} opacity={0.7} />
      )}

      {/* Marcadores de Inicio y Fin */}
      {start && (
        <Marker position={[start.lat, start.lng]}>
          <Popup>Inicio</Popup>
        </Marker>
      )}
      
      {end && (
        <Marker position={[end.lat, end.lng]}>
          <Popup>Fin</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default ActivityMap;