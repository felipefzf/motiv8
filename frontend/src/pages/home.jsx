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
    <div>
      <h1>Página Home</h1>
      <p>Backend dice: {mensaje}</p>
    </div>
  );
}