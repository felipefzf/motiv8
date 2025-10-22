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
  const [enrichedActivities, setEnrichedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [cities, setCities] = useState({}); //GEOAPIFY


  useEffect(() => {

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    //
    const fetchAccessTokenAndActivities = async () => {
      try {
        setLoading(true);
        const tokenResponse = await axios.post('http://localhost:5000/exchange_token', { code });
        const accessToken = tokenResponse.data.access_token;

        const activitiesResponse = await axios.get(`https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}`);
        const fetchedActivities = activitiesResponse.data;

        const enrichedList = [];

        for (const activity of fetchedActivities) {
          const enriched = {
            id: activity.id,
            name: activity.name,
            type: activity.type,
            distance: formatDistance(activity),
            rawDistance: activity.distance,
            movingTime: formatMovingTime(activity),
            rawMovingTime: activity.moving_time,
            averageSpeed: activity.average_speed,
            maxSpeed: activity.max_speed,
            elevationGain: activity.total_elevation_gain,
            startLatLng: activity.start_latlng,
            endLatLng: activity.end_latlng,
            comunaStart: activity.start_latlng ? await getComunaFromGeoapify(...activity.start_latlng) : "No disponible",
            comunaEnd: activity.end_latlng ? await getComunaFromGeoapify(...activity.end_latlng) : "No disponible"
          };

          enrichedList.push(enriched);
        }
        setEnrichedActivities(enrichedList);
        setLoading(false);
        // Obtener ciudades de inicio y término
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLoading(false);
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

      {loading ? (
        <p>SUBIENDO INFORMACIÓN DE LAS ACTIVIDADES...</p>
        
      ) : enrichedActivities.length === 0 ? (
        <p>CARGANDO INFORMACIÓN DE LAS ACTIVIDADES...</p>
      ) : (
        <ul>
          {enrichedActivities.map((activity) => (
            <li key={activity.id}>
              id: {activity.id} <br />
              Nombre actividad: {activity.name} / Deporte: {activity.type} <br />
              Distancia: {activity.distance} ({activity.rawDistance} m) / Tiempo en movimiento: {activity.movingTime} ({activity.rawMovingTime} s) <br />
              Velocidad Promedio: {activity.averageSpeed} / Velocidad punta: {activity.maxSpeed} / Elevación: {activity.elevationGain} <br />
              Punto Inicio: {activity.startLatLng?.join(', ')} / Punto de término: {activity.endLatLng?.join(', ')} <br />
              Comuna de inicio: {activity.comunaStart} <br />
              Comuna de término: {activity.comunaEnd} <br />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

};

export default Activities;

