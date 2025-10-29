import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './login.css'; // 👈 Importamos los estilos externos

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');

      const userData = await response.json();
      login(token, userData);

      navigate(userData.role === 'admin' ? '/' : '/');
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      console.error("Error de login:", err);
    }
  };

  return (
      <div className="login-container">
        <h1 className="login-title">MOTIV8</h1>
        <h2 className="login-subtitle">Iniciar Sesión</h2>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            required
            className="login-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="login-input"
          />
          <button type="submit" className="login-button">Entrar</button>

          <div className="register-section">
            <p>¿No tienes una cuenta?</p>
            <Link to="/register" className="register-link">Regístrate Aquí</Link>
          </div>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
  );
}

export default Login;
