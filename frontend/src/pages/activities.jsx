import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistance, formatMovingTime } from "../utils/stravaUtils";

//GEOAPIFY
async function getCityFromGeoapify(lat, lng) {
  const apiKey = '8e6613c9028d433cb7b81f5622af46da'; // tu API Key de Geoapify
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const city = data.features[0]?.properties.city || "Ciudad desconocida";
    return city;
  } catch (error) {
    console.error("Error al obtener ciudad desde Geoapify:", error);
    return "Error al obtener ciudad";
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
            cityData.start = await getCityFromGeoapify(lat, lng);
          }

          if (activity.end_latlng) {
            const [lat, lng] = activity.end_latlng;
            cityData.end = await getCityFromGeoapify(lat, lng);
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
              Nombre actividad: {activity.name} 
              <br /> 
              Distancia: {formatDistance(activity)} {}
              Tiempo en movimiento: {formatMovingTime(activity)} {} 
              Deporte: {activity.type} {}
              Velocidad Promedio: {activity.average_speed} {}
              Velocidad punta: {activity.max_speed} {}
              total_elevation_gain: {activity.total_elevation_gain} {} - 
              {activity.start_latlng} {activity.end_latlng} <br />
              Ciudad de inicio: {cities[activity.id]?.start || "Cargando..."} <br />
              Ciudad de término: {cities[activity.id]?.end || "Cargando..."} <br />

            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Activities;

