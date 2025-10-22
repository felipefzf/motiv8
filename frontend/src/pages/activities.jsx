import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistance, formatMovingTime } from "../utils/stravaUtils";

//GEOAPIFY


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

//GEOAPIFY

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [cities, setCities] = useState({}); //GEOAPIFY

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
//
    const fetchAccessTokenAndActivities = async () => {
      try {
        const tokenResponse = await axios.post('http://localhost:5000/exchange_token', { code });
        const accessToken = tokenResponse.data.access_token;

        const activitiesResponse = await axios.get(`https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}`);
        const fetchedActivities = activitiesResponse.data;
        setActivities(fetchedActivities);

        // Obtener ciudades de inicio y término
        const cityMap = {};

        for (const activity of fetchedActivities) {
          const cityData = {};

          if (activity.start_latlng) {
            const [lat, lng] = activity.start_latlng;
            cityData.start = await getComunaFromGeoapify(lat, lng);
          }

          if (activity.end_latlng) {
            const [lat, lng] = activity.end_latlng;
            cityData.end = await getComunaFromGeoapify(lat, lng);
          }

          cityMap[activity.id] = cityData;
        }

        setCities(cityMap);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    if (code) {
      fetchAccessTokenAndActivities();
    }
  }, []);
//
  return (
    <div style={{ color: '#fff', padding: '20px' }}>
      <h2>Actividades de Strava</h2>
      {activities.length === 0 ? (
        <p>No hay actividades para mostrar.</p>
      ) : (
        <ul>
          {activities.map((activity) => (
            <li key={activity.id}>
              id: {activity.id} {} <br /> 
              Nombre actividad: {activity.name} {'/ '} Deporte: {activity.type} {}
              <br /> 
              Distancia: {formatDistance(activity)} {activity.distance} {'/ '} Tiempo en movimiento: {formatMovingTime(activity)} {activity.moving_time} {} <br />
              
              Velocidad Promedio: {activity.average_speed} {'/ '} Velocidad punta: {activity.max_speed} {'/ '} total_elevation_gain: {activity.total_elevation_gain} {} <br />
              Punto Inicio {activity.start_latlng} {'/ '} Punto de termino {activity.end_latlng} <br />
              Comuna de inicio: {cities[activity.id]?.start || "Cargando..."} <br />
              Comuna de término: {cities[activity.id]?.end || "Cargando..."} <br />

            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Activities;

