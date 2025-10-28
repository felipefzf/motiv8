import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext'; // 1. Importa el hook useAuth

// (Tus estilos se quedan igual)
const styles = {
  registerButton: {
    display: 'inline-block',
    padding: '10px 20px',
    margin: '10px 0',
    backgroundColor: '#007bff',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. Obtén la función 'login' del contexto

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Inicia sesión con Firebase (esto no cambia)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtiene el token (esto no cambia)
      const token = await userCredential.user.getIdToken();

      // --- CAMBIOS AQUÍ ---
      // Ya NO guardamos el token en localStorage directamente.

      // Busca los datos del usuario (name, role, etc.) desde tu backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudieron obtener los datos del usuario.');
      }

      const userData = await response.json(); // Objeto con { uid, email, role, etc. }
      
      // Ya NO guardamos el rol en localStorage directamente.

      // 3. Llama a la función 'login' del Contexto.
      // Esta función se encarga de:
      //   - Guardar el token en localStorage (si así lo configuraste en el context)
      //   - Actualizar el estado 'token' del contexto
      //   - Actualizar el estado 'user' del contexto con userData
      login(token, userData); 
      // --- FIN DE LOS CAMBIOS ---

      // Redirige según el rol (esto no cambia)
      if (userData.role === 'admin') {
        navigate('/'); // O '/admin-dashboard' si prefieres
      } else {
        navigate('/'); // Al dashboard principal
      }

    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      console.error("Error de login:", err);
    }
  };

  return (
    <div>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Correo" 
          required 
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Contraseña" 
          required 
        />
        <button type="submit">Entrar</button>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>¿No tienes una cuenta?</p>
          <Link to="/register" style={styles.registerButton}>
            Regístrate Aquí
          </Link>
        </div>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;