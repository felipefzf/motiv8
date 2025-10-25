import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Importa tu servicio de auth
import { Link } from 'react-router-dom'; // Importa Link de React Router

// 1. Define estilos para el botón de registro
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Inicia sesión con el servicio de Auth de Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Obtiene el ID Token (la credencial de sesión)
      const token = await userCredential.user.getIdToken();

      // 3. Guarda el token en localStorage para usarlo en toda la app
      localStorage.setItem('firebaseToken', token);
      
      const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('No se pudieron obtener los datos del usuario.');
    }

    const userData = await response.json(); // Esto tendrá { uid, email, role }
    
    // 4. Guarda el rol en localStorage
    localStorage.setItem('userRole', userData.role); 
    // --- FIN DEL PASO NUEVO ---

    // 5. Redirige al usuario
    // Si es admin, llévalo al dashboard de admin, si no, al dashboard normal
    if (userData.role === 'admin') {
      navigate('/');
    } else {
      navigate('/'); // O a tu página de inicio para usuarios
    }
      // 4. Redirige al usuario (ej. a un dashboard)
      // navigate('/dashboard'); 

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
        
        {/* 2. Añade el componente <Link> apuntando a tu ruta de registro */}
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