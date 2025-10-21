import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseconfig'; // Importa tu servicio de auth

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
      navigate('/adminDashboard');
    } else {
      navigate('/profile'); // O a tu página de inicio para usuarios
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
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;