import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/hello")
      .then(res => setMensaje(res.data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ color: '#fff', padding: '20px' }}>
      <h1 style={{alignItems:"upper",justifyContent:"left",display:"flex"}}>Motiv8</h1>
      <p style={{alignItems:"center",justifyContent:"center",display:"flex"}}>Backend dice: {mensaje}</p>
    </div>
  );
}