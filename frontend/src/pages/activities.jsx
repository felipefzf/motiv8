import React, {useEffect, useState} from 'react';


import axios from 'axios';


export default function Activities() {
  

  const clientID = 179868
  const clientSecret = '093af90ac7d9f9c8bb34f06c32e9041a7f0f0593' 
  const refreshToken = 'bd701a1e8367768942f02e0cc613d6f407b8e1b7'
  const activities_link = 'https://www.strava.com/api/v3/athlete/activities'
  const auth_link = 'https://www.strava.com/oauth/token'

  useEffect(() => {
    async function fetchData() {
        const stravaActivityResponse = await axios.get(`${activities_link}?access_token=2e40ae438564c399560ded85069fdd0154b1dbf1`)
        console.log(stravaActivityResponse)
}
    fetchData();
  }, []);

  return (
    <div>
      <h2>Actividades de Strava</h2>
        <p>Cargando actividades...</p>
    </div>
  );
}
