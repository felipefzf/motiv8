import React, { useEffect, useState } from 'react';
import tomy from '../assets/tomy.png';
import bici from '../assets/bicicleta.png';
import medalla from '../assets/medalla.png';
import objetivo from '../assets/objetivo.png';
import equipo from '../assets/equipo.png';
import './Profile.css';
// 1. Importa useAuth desde tu contexto
import { useAuth } from '../context/authContext'; // <-- (Asegúrate que la ruta sea correcta)
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';


// (No necesitas 'signOut' o 'auth' si el contexto ya lo maneja)
// import { useNavigate } from 'react-router-dom';
// import { signOut } from 'firebase/auth';
// import { auth } from '../firebaseConfig';


export default function Profile() {
  // 2. Llama al hook de AuthContext
  const { user } = useAuth(); // <-- 'user' ahora está definido
    const navigate = useNavigate();
  // const navigate = useNavigate(); // <-- Ya no es necesario si 'logout' redirige
  const [theme, setTheme] = useState('dark');

  // Tu lógica de tema (esto está perfecto)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 3. Lógica de Logout (simplificada)
  const handleLogout = async () => {
    try {
      // Simplemente llama a la función 'logout' del contexto.
      // Ella se encarga de signOut, limpiar localStorage y redirigir.
      await signOut(auth);
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('userRole');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // 4. Guardia de carga (importante)
  // Muestra "Cargando..." mientras el AuthContext obtiene los datos del usuario.
  if (!user) {
    return <p>Cargando perfil...</p>;
  }

  // Si 'user' existe, renderiza el perfil:
  return (
    <div className="profile-container">
      <button onClick={toggleTheme} className="theme-toggle-btn">
        {theme === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Oscuro'}
      </button>

      <h1 className="profile-title">MOTIV8</h1>
      <h2 className="profile-subtitle">Perfil</h2>

      <div className="profile-content">
        <img
          src={tomy}
          className="profile-image rounded-circle border"
          alt="Perfil"
        />
        <h4 className="profile-name">
          {/* Ahora 'user.name' funciona */}
          {user.name} <span className="profile-level">Nivel 7</span>
        </h4>
        <br />
        <p>
          {/* Y 'user.comuna' también (si existe en tu DB) */}
          Ubicación: <span className="profile-level">{user.comuna || 'No definida'}, {user.region || 'Chile'}</span>
        </p>
        <p>
          Deporte Principal: <span className="profile-level">Ciclismo</span>
        </p>

        {/* ... (El resto de tu JSX de estadísticas y logros no cambia) ... */}
        <h3 className="section-title">Estadísticas</h3>
        <div className="container text-center">
          {/* ... (tus stats) ... */}
        </div>

        <h3 className="section-title">Logros y Medallas</h3>
        <div className="achievements">
          <img src={bici} alt="Medalla 1" />
          <img src={medalla} alt="Medalla 2" />
          <img src={objetivo} alt="Medalla 3" />
          <img src={equipo} alt="Medalla 4" />
        </div>

        <br />
        <button onClick={handleLogout} className="btn btn-danger">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}