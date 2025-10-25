import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './navbar'; // <-- Asegúrate de que esta ruta sea correcta
import HamburgerMenu from './hamburgerMenu';

const MainLayout = () => {
  return (
    <>
      {/* 1. El Navbar se renderiza primero */}
      <Navbar /> 
      <HamburgerMenu />
      {/* 2. El resto de la página (ej. Dashboard) se renderiza aquí */}
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;