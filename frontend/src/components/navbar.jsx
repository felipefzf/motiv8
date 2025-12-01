
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react"; 
import styles from "./Navbar.module.css"; 

import homeImg from "../assets/home.png";
import profileImg from "../assets/profile.png";
import aboutImg from "../assets/about.png";
import shopImg from "../assets/shop.png";
import teamImg from "../assets/team.png";



export default function Navbar() {
  const links = [
    
    { to: "/rankings", img: aboutImg, alt: "Rankings" },
    { to: "/shop", img: shopImg, alt: "Tienda" },
    { to: "/", img: homeImg, alt: "Inicio" },
    { to: "/teams", img: teamImg, alt: "Equipos" },
    { to: "/profile", img: profileImg, alt: "Perfil" },
  ];

  const navRef = useRef(null);
  const location = useLocation();

  // --- ARREGLO AQUÍ ---
 
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
 
      setBubbleStyle({
        left: offsetLeft,
        width: offsetWidth,
        opacity: 1, 
      });
    } else {
      
      setBubbleStyle({
        opacity: 0,
        left: bubbleStyle.left, 
        width: bubbleStyle.width,
      });
    }
    
  }, [location.pathname, bubbleStyle.left, bubbleStyle.width]);

  return (
    <nav ref={navRef} className={styles.navbar}>
      
     

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