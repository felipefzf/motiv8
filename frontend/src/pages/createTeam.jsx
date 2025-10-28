
import './Teams.css';

import React, { useState } from 'react';
import axios from 'axios';
import { auth } from '../firebaseConfig'; // Asegúrate de importar tu configuración de Firebase

export default function CreateTeam() {
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [tipoDeporte, setTipoDeporte] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert('Usuario no autenticado');
      return;
    }

    const uid = user.uid;

    try {
      const response = await axios.post('http://localhost:5000/teams', {
        nombreEquipo,
        tipoDeporte,
        descripcion,
        creadoPor: uid // 👈 Enviamos el UID directamente
      });
      
      

      alert('Equipo creado con éxito');
      console.log(response.data);
      // Redirigir a la página de dashboard del administrador
      window.location.href = '/teams';
    } catch (error) {
      console.error('Error al crear el equipo:', error);
      alert('Hubo un error al crear el equipo');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Crea tu equipo</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Nombre del equipo</label>
          <input
            type="text"
            className="form-control"
            value={nombreEquipo}
            onChange={(e) => setNombreEquipo(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-3">
          <label>Tipo de deporte</label>
          <select
            className="form-control"
            value={tipoDeporte}
            onChange={(e) => setTipoDeporte(e.target.value)}
            required
          >
            <option value="">Selecciona un deporte</option>
            <option value="Correr">Correr</option>
            <option value="Ciclismo">Ciclismo</option>
          </select>
        </div>
        <div className="mb-3">
          <label>Descripción</label>
          <textarea
            className="form-control"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Crear equipo</button>
      </form>
    </div>
  );
}