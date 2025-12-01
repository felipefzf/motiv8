import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './navbar'; 
import HamburgerMenu from './hamburgerMenu';

const MainLayout = () => {
  return (
    <>
      
      <Navbar /> 
      <HamburgerMenu />
     
      <main style={{paddingBottom: '80px'}}>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;