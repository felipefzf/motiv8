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
      <h1 style={{ margin: 0, color: '#ffd000ff' }}>MOTIV8</h1>
      <h3 style={{ margin: '5px 0 10px 0' }}>Home</h3>
      <p style={{alignItems:"center",justifyContent:"center",display:"flex"}}>Backend dice: {mensaje}</p>
    </div >
  );
}