import { useState } from "react";
import "./activityCreator.css";
import { regionesYcomunas } from "../utils/funcionUtils";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";

export default function ActivityCreator() {
  const { token } = useAuth();
  const [regionInicio, setRegionInicio] = useState("");
  const [regionTermino, setRegionTermino] = useState("");
  const [comunasInicio, setComunasInicio] = useState([]);
  const [comunasTermino, setComunasTermino] = useState([]);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreActividad: "",
    kilometros: "",
    tiempo: "",
    velocidadPunta: "",
    velocidadPromedio: "",
    comunaInicio: "",
    comunaTermino: "",
  });

  const handleRegionInicio = (e) => {
    const region = e.target.value;
    setRegionInicio(region);
    const regionData = regionesYcomunas.find((r) => r.region === region);
    setComunasInicio(regionData ? regionData.comunas : []);
    setFormData({ ...formData, comunaInicio: "" });
  };

  const handleRegionTermino = (e) => {
    const region = e.target.value;
    setRegionTermino(region);
    const regionData = regionesYcomunas.find((r) => r.region === region);
    setComunasTermino(regionData ? regionData.comunas : []);
    setFormData({ ...formData, comunaTermino: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const actividad = {
      path: [], // opcional
      distance: Number(formData.kilometros),
      time: Number(formData.tiempo),
      avg_speed: Number(formData.velocidadPromedio),
      max_speed: Number(formData.velocidadPunta),
      regionInicio: regionInicio,
      regionTermino: regionTermino,
      comunaInicio: formData.comunaInicio,
      comunaTermino: formData.comunaTermino,
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/activities",
        actividad,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("✅ Actividad registrada y progreso actualizado");
      console.log("Misiones actualizadas:", res.data.missions);

      // ✅ Redirigir al Home
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error registrando actividad:", error);
      alert("❌ Error al registrar actividad");
    }
  };

  return (
    <div className="act-container">
      <h1 className="act-title">MOTIV8</h1>
      <form className="activity-form" onSubmit={handleSubmit}>
        <h2>Registrar Actividad</h2>

        <label>Nombre de la Actividad:</label>
        <input
          type="text"
          name="nombreActividad"
          value={formData.nombreActividad}
          onChange={handleChange}
          required
        />

        <label>Región de Inicio:</label>
        <select value={regionInicio} onChange={handleRegionInicio} required>
          <option value="">Seleccione una región</option>
          {regionesYcomunas.map((r, i) => (
            <option key={i} value={r.region}>
              {r.region}
            </option>
          ))}
        </select>

        <label>Comuna de Inicio:</label>
        <select
          name="comunaInicio"
          value={formData.comunaInicio}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione una comuna</option>
          {comunasInicio.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label>Región de Término:</label>
        <select value={regionTermino} onChange={handleRegionTermino} required>
          <option value="">Seleccione una región</option>
          {regionesYcomunas.map((r, i) => (
            <option key={i} value={r.region}>
              {r.region}
            </option>
          ))}
        </select>

        <label>Comuna de Término:</label>
        <select
          name="comunaTermino"
          value={formData.comunaTermino}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione una comuna</option>
          {comunasTermino.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label>Kilómetros Totales:</label>
        <input
          type="number"
          name="kilometros"
          value={formData.kilometros}
          onChange={handleChange}
          required
        />

        <label>Tiempo (minutos):</label>
        <input
          type="number"
          name="tiempo"
          value={formData.tiempo}
          onChange={handleChange}
          required
        />

        <label>Velocidad Punta (km/h):</label>
        <input
          type="number"
          name="velocidadPunta"
          value={formData.velocidadPunta}
          onChange={handleChange}
          required
        />

        <label>Velocidad Promedio (km/h):</label>
        <input
          type="number"
          name="velocidadPromedio"
          value={formData.velocidadPromedio}
          onChange={handleChange}
          required
        />

        <button type="submit" className="btn btn-primary">
          Registrar Actividad
        </button>
      </form>
    </div>
  );
}
