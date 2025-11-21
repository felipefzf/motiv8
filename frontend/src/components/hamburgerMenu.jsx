import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import styles from './HamburgerMenu.module.css';
// Necesitarás react-icons para los iconos
// Instálalo con: npm install react-icons
import { FaBars, FaTimes } from 'react-icons/fa';

function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // 2. Función para abrir/cerrar el menú
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 3. Función para cerrar el menú (al hacer clic en un link)
  const closeMenu = () => {
    setIsOpen(false);
  };

  // 4. Si el usuario no es admin, no renderiza nada.
  if (user?.role !== 'admin') {
    return null;
  }

  // 5. Si es admin, renderiza el botón y el menú
  return (
    <div className={styles.hamburgerContainer}>
      {/* El botón de la hamburguesa */}
      <button onClick={toggleMenu} className={styles.toggleButton}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* El menú desplegable (usa clases CSS para mostrar/ocultar) */}
      <nav className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
        <ul>
          <li>
            <NavLink 
              to="/admindashboard" 
              className={styles.navLink} 
              onClick={closeMenu}
            >
              Crear Ítems
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/missionDashboard" 
              className={styles.navLink} 
              onClick={closeMenu}
            >
              Administrar Misiones
            </NavLink>
          </li>
          {/* Añade aquí más rutas de admin si las necesitas */}
        </ul>
      </nav>
    </div>
  );
}

export default HamburgerMenu;