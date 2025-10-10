
import React, { useEffect } from "react";
import axios from 'axios';
  //const clientId = 179868;
  //const redirectUri = "http://localhost:5173/home";
  //const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read_all`;
  //window.location.href = authUrl;

export default function Login() {
  const clientId = 179868;
  const redirectUri = "http://localhost:5173/activities";
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=activity:read_all`;

  const handleStravaLogin = () => {
    window.location.href = authUrl;
  };

  return (
    <div className="login-container">
      <h2>Inicia sesión</h2>
      <button
        onClick={handleStravaLogin}
        style={{
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
  );
}