// src/components/Navbar/Navbar.jsx

// 1. Importa los hooks necesarios
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react"; 
import styles from "./Navbar.module.css"; 

import homeImg from "../assets/home.png";
import profileImg from "../assets/profile.png";
import aboutImg from "../assets/about.png";
import loginImg from "../assets/login.png";
import teamImg from "../assets/team.png";

// ... (tus imports de imágenes) ...

export default function Navbar() {
  const links = [
    
    { to: "/activities", img: aboutImg, alt: "Actividades" },
    { to: "/login", img: loginImg, alt: "Login" },
    { to: "/", img: homeImg, alt: "Inicio" },
    { to: "/teams", img: teamImg, alt: "Equipos" },
    { to: "/profile", img: profileImg, alt: "Perfil" },
  ];

  const navRef = useRef(null);
  const location = useLocation();

  // --- ARREGLO AQUÍ ---
  // El estado inicial SOLO controla lo horizontal y la opacidad.
  const [bubbleStyle, setBubbleStyle] = useState({
    opacity: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeLink = nav.querySelector(`.${styles.activeLink}`);

    if (activeLink) {
      const { offsetLeft, offsetWidth } = activeLink;
      
      // --- ARREGLO AQUÍ ---
      // Solo actualizamos las propiedades horizontales.
      setBubbleStyle({
        left: offsetLeft,
        width: offsetWidth,
        opacity: 1, // Opacidad de la burbuja (puedes cambiarla)
      });
    } else {
      // Ocultamos la burbuja si no hay link activo
      setBubbleStyle({
        opacity: 0,
        left: bubbleStyle.left, // Mantenemos la posición para que se desvanezca
        width: bubbleStyle.width,
      });
    }
    // Añadimos bubbleStyle.left y bubbleStyle.width a las dependencias
  }, [location.pathname, bubbleStyle.left, bubbleStyle.width]);

  return (
    <nav ref={navRef} className={styles.navbar}>
      
      {/* TRABAJANDO EN BUBBLE AQUI ABAJITO */}
      {/* <div className={styles.bubble} style={bubbleStyle} /> */}

      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.activeLink : ""}`
          }
        >
          <img
            src={link.img}
            alt={link.alt}
            className={styles.navImage}
          />
        </NavLink>
      ))}
    </nav>
  );
}