import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './HamburgerMenu.module.css';
// Necesitarás react-icons para los iconos
// Instálalo con: npm install react-icons
import { FaBars, FaTimes } from 'react-icons/fa';

function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Revisa el rol del usuario cuando el componente se carga
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      setIsAdmin(true);
    }
  }, []);

  // 2. Función para abrir/cerrar el menú
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 3. Función para cerrar el menú (al hacer clic en un link)
  const closeMenu = () => {
    setIsOpen(false);
  };

  // 4. Si el usuario no es admin, no renderiza nada.
  if (!isAdmin) {
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
              Admin Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/missionCreator" 
              className={styles.navLink} 
              onClick={closeMenu}
            >
              Crear Misión
            </NavLink>
          </li>
          {/* Añade aquí más rutas de admin si las necesitas */}
        </ul>
      </nav>
    </div>
  );
}

export default HamburgerMenu;