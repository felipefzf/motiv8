// frontend/src/App.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Importa Link de React Router

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Llama a TU PROPIO backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        // Si el servidor envió un error (ej. "email ya existe")
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newUser = await response.json();
      
      // ¡Éxito! El usuario está creado en Auth Y en Firestore con role: 'user'
      // Ahora puedes, por ejemplo, redirigirlo al login
      console.log('Usuario registrado:', newUser);
      // history.push('/login') o similar
      alert('Registro exitoso. Puedes iniciar sesión ahora.');
      window.location.href = '/login';
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0 0 0 / 10%)',color: '#fff' }}>
      <h2>Registrar Nuevo Usuario</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Tu nombre"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '12px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Registrar
        </button>
        <Link to="/login">  
          Volver a Login
        </Link>
      </form>
      {error && (
        <p style={{
          marginTop: '20px',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: '#ffe0e0', // Fondo rojo claro (error)
          color: '#cc0000', // Texto rojo oscuro
          border: '1px solid #cc0000', // Borde rojo
          fontWeight: 'bold'
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
