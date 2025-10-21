// frontend/src/App.jsx
import React, { useState } from 'react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      // --- ESTA URL DEBE APUNTAR A TU BACKEND EN PUERTO 5000 ---
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`¡Usuario registrado con éxito! UID: ${data.uid}`);
        setEmail('');
        setPassword('');
      } else {
        setIsError(true);
        setMessage(`Error al registrar usuario: ${data.error}`);
      }
    } catch (error) {
      setIsError(true);
      setMessage(`Error de conexión al servidor: ${error.message}`);
      console.error('Error de red:', error);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0 0 0 / 10%)' }}>
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
      </form>
      {message && (
        <p style={{
          marginTop: '20px',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: isError ? '#ffe0e0' : '#e0ffe0',
          color: isError ? '#cc0000' : '#007200',
          border: `1px solid ${isError ? '#cc0000' : '#007200'}`
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
