import React, { useEffect, useState } from 'react';
import tomy from '../assets/tomy.png';
import bici from '../assets/bicicleta.png';
import medalla from '../assets/medalla.png';
import objetivo from '../assets/objetivo.png';
import equipo from '../assets/equipo.png';
import './Profile.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function Profile() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');

  // Leer el tema guardado o usar "dark" por defecto
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  // Cambiar tema y guardarlo
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('userRole');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

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
          tms.pz <span className="profile-level">Nivel 7</span>
        </h4>
        <br />
        <p>Ubicación: <span className="profile-level">Ñuñoa, Chile</span></p>
        <p>Deporte Principal: <span className="profile-level">Ciclismo</span></p>

        <h3 className="section-title">Estadísticas</h3>
        <div className="container text-center">
          <div className="row row-cols-2">
            <div className="card-profile">
              <div className="card-body">
                <p>Distancia: <span className="highlight">270 km</span></p>
              </div>
            </div>
            <div className="card-profile">
              <div className="card-body">
                <p>Tiempo: <span className="highlight">120 hrs</span></p>
              </div>
            </div>
            <div className="card-profile">
              <div className="card-body">
                <p>Misiones: <span className="highlight">45 Completadas</span></p>
              </div>
            </div>
            <div className="card-profile">
              <div className="card-body">
                <p>Insignias: <span className="highlight">8 Obtenidas</span></p>
              </div>
            </div>
          </div>
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
