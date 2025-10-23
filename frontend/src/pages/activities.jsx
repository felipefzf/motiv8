import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistance, formatMovingTime } from "../utils/stravaUtils";
import { translateActivityType } from "../utils/stravaUtils";

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

  // filtros
  const [nameFilter, setNameFilter] = useState("");
  const [startFilter, setStartFilter] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    const fetchAccessTokenAndActivities = async () => {
      try {
        setLoading(true);
        const tokenResponse = await axios.post('http://localhost:5000/exchange_token', { code });
        const accessToken = tokenResponse.data.access_token;

        const activitiesResponse = await axios.get(
          `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}`
        );
        const fetchedActivities = activitiesResponse.data;

        const enrichedList = [];

        for (const activity of fetchedActivities) {
          const enriched = {
            id: activity.id,
            name: activity.name,
            type: translateActivityType(activity),
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
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLoading(false);
      }
    };

    if (code) {
      fetchAccessTokenAndActivities();
    }
  }, []);

  // aplicar filtros opcionales
  const filteredActivities = enrichedActivities.filter((activity) => {
    const byName = nameFilter
      ? activity.name.toLowerCase().includes(nameFilter.toLowerCase())
      : true;
    const byStart = startFilter
      ? activity.comunaStart.toLowerCase().includes(startFilter.toLowerCase())
      : true;
    return byName && byStart;
  });

  //
  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h1 style={{ margin: 0, color: '#ffd000ff' }}>Motiv8</h1>
      <h3 style={{ margin: '5px 0 10px 0' }}>Actividades de Strava</h3>

      {/* filtros opcionales */}
      <input
        type="text"
        placeholder="Filtrar por nombre..."
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        style={{ marginBottom: '10px', padding: '5px', borderRadius: '6px', width: '80%' }}
      />
      <input
        type="text"
        placeholder="Filtrar por punto inicio..."
        value={startFilter}
        onChange={(e) => setStartFilter(e.target.value)}
        style={{ marginBottom: '20px', padding: '5px', borderRadius: '6px', width: '80%' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {loading ? (
          <p>SUBIENDO INFORMACIÓN DE LAS ACTIVIDADES...</p>
        ) : filteredActivities.length === 0 ? (
          <p>CARGANDO INFORMACIÓN DE LAS ACTIVIDADES...</p>
        ) : (
          <div>
            <ul>
              {filteredActivities.map((activity) => (
                <li key={activity.id}>
                  ID: {activity.id} <span style={{ color: '#ffd000ff' }}>{activity.name}</span> <br />
                  Nombre actividad: <span style={{ color: '#ffd000ff' }}>{activity.name}</span> / Deporte: <span style={{ color: '#ffd000ff' }}>{activity.type}</span><br />
                  Distancia: <span style={{ color: '#ffd000ff' }}>{activity.distance}</span> / Tiempo en movimiento: <span style={{ color: '#ffd000ff' }}>{activity.movingTime}</span> <br />
                  Velocidad Promedio: <span style={{ color: '#ffd000ff' }}>{activity.averageSpeed}</span> / Velocidad punta: <span style={{ color: '#ffd000ff' }}>{activity.maxSpeed}</span> / Elevación: <span style={{ color: '#ffd000ff' }}>{activity.elevationGain}</span> <br />
                  Punto Inicio: <span style={{ color: '#ffd000ff' }}>{activity.comunaStart}</span> <br />
                  Punto de término: <span style={{ color: '#ffd000ff' }}>{activity.comunaEnd}</span> <br />
                  <br />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activities;
