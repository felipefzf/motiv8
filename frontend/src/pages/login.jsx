// import { useEffect } from 'react';
// import axios from 'axios';
// import React from "react";

// export default function Login() {
//   const handleStravaLogin = () => {
//     window.location.href = "https://www.strava.com/oauth/authorize?client_id=179868&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=read";
//   };

//   return (
//     <div className="login-container">
//       <h2>Inicia sesión</h2>
//       <button
//         onClick={handleStravaLogin}
//         style={{
//           backgroundColor: "#fc4c02",
//           color: "white",
//           padding: "10px 20px",
//           border: "none",
//           borderRadius: "5px",
//           cursor: "pointer",
//         }}
//       >
//         🔗 Conectar con Strava
//       </button>
//     </div>
//   );
// }


export default function Login() {



  const clientId = 179868;
  const redirectUri = "http://localhost:5173/home";

  const handleStravaLogin = () => { 
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read_all`;
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