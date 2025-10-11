import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import homeImg from "../assets/home.png";
import profileImg from "../assets/profile.png";
import aboutImg from "../assets/about.png";
import loginImg from "../assets/login.png";
import teamImg from "../assets/team.png";

export default function Navbar() {
  const location = useLocation();

  const links = [
    { to: "/", img: homeImg, alt: "Inicio" },
    { to: "/login", img: loginImg, alt: "Login" },
    { to: "/teams", img: teamImg, alt: "Equipos" },
    { to: "/activities", img: aboutImg, alt: "Actividades" },
    { to: "/profile", img: profileImg, alt: "Perfil" },
  ];

  return (
    <nav
      style={{
        padding: "12px",
        background: "#f7f7f7",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      {links.map((link) => {
        const isActive = location.pathname === link.to;

        return (
          <Link key={link.to} to={link.to} style={{ position: "relative" }}>
            <motion.img
              src={link.img}
              alt={link.alt}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.15, rotate: 3 }}
              animate={isActive ? { scale: 1.2, y: -4 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                cursor: "pointer",
                filter: isActive
                  ? "drop-shadow(0 0 8px #00b4d8)"
                  : "drop-shadow(0 0 0 transparent)",
              }}
            />
            {/* {isActive && (
              <motion.div
                layoutId="activeIndicator"
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#00b4d8",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              />
            )} */}
          </Link>
        );
      })}
    </nav>
  );
}
