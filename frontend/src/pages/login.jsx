
import React, { useEffect } from "react";
import axios from 'axios';
  //const clientId = 179868;
  //const redirectUri = "http://localhost:5173/home";
  //const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read_all`;
  //window.location.href = authUrl;

export default function Login() {
  const clientId = 179868;
  const redirectUri = "http://localhost:5173/activities";
  const scope = 'activity:read_all';
  const responseType = 'code';
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

  const handleStravaLogin = () => {
    window.location.href = authUrl;
  };

  return (
    <div className="login-container" style={{ color: '#fff', padding: '20px' }}>
      <h1 style={{ margin: 0, color: '#ffd000ff' }}>Motiv8</h1>
      <h3 style={{margin: '5px 0 10px 0'}}>Inicia sesión</h3>
      <div>
        <button 
        onClick={handleStravaLogin}
        style={{alignItems:"center",justifyContent:"center",display:"flex",
          backgroundColor: "#fc4c02",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        🔗 Conectar con Strava
      </button>
      </div>
      
    </div>
  );
}