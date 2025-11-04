// frontend/src/App.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Register.css'; // 👈 Importamos los estilos externos
import { regionesYcomunas } from "../utils/funcionUtils"

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [region, setRegion] = useState(''); 
  const [comuna, setComuna] = useState('');



  const handleRegionChange = (e) => {
    const selectedRegion = e.target.value;
    setRegion(selectedRegion);
    // 💡 Resetear la comuna cuando cambia la región
    setComuna(''); 
  };
  const handleComunaChange = (e) => {
    setComuna(e.target.value);
  };

  const comunasDeRegion = region 
    ? regionesYcomunas.find(r => r.region === region)?.comunas || []
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!region || !comuna) {
        setError('Por favor, selecciona una Región y una Comuna.');
        return;
    }
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, region, comuna}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newUser = await response.json();
      console.log('Usuario registrado:', newUser);
      alert('Registro exitoso. Puedes iniciar sesión ahora.');
      window.location.href = '/login';
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <h1 className='register-title'>MOTIV8</h1>
      <h2 className='register-subtitle'>Registrar Usuario</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Correo"
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nombre"
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Contraseña"
          />
        </div>

        <div className="form-group">
          <select
            id="region"
            value={region}
            onChange={handleRegionChange}
            required
            // Asegúrate de definir esta clase en Register.css
            className='register-select' 
          >
            <option value="">Selecciona una Región</option>
            {/* Mapeamos las opciones usando tu array regionesYcomunas */}
            {regionesYcomunas.map((r) => (
              <option key={r.region} value={r.region}>
                {r.region}
              </option>
            ))}
          </select>
        </div>

        {/* --- SELECTOR DE COMUNA --- */}
        <div className="form-group">
          <select
            id="comuna"
            value={comuna}
            onChange={handleComunaChange}
            required
            // Deshabilitado si no hay región seleccionada
            disabled={!region} 
            className='register-select'
          >
            <option value="">Selecciona una Comuna</option>
            {/* Mapeamos las comunas filtradas */}
            {comunasDeRegion.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="register-button">
          Registrar
        </button>

        <Link to="/login" className="back-link">
          Volver a Login
        </Link>
      </form>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
