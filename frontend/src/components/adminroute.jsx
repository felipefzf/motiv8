// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  // Revisa el rol guardado en el localStorage
  const userRole = localStorage.getItem('userRole');

  // Si el rol es 'admin', permite el acceso a las rutas hijas (Outlet)
  // Si no, redirige al usuario (ej. al dashboard principal)
  return userRole === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;