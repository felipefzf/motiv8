import { useEffect, useState } from 'react';
import axios from 'axios';

const Activities = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
//
    const fetchAccessTokenAndActivities = async () => {
      try {
        const tokenResponse = await axios.post('http://localhost:5000/exchange_token', { code });
        const accessToken = tokenResponse.data.access_token;

        const activitiesResponse = await axios.get(`https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}`);
        setActivities(activitiesResponse.data);
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
              {activity.name} - {activity.distance} metros
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Activities;

