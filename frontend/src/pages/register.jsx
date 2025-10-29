// frontend/src/App.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Register.css'; // 👈 Importamos los estilos externos

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
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
