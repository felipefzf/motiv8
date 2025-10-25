import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 1. Revisa si el usuario tiene una sesión (un token)
  const token = localStorage.getItem('firebaseToken');

  // 2. Si hay token, renderiza la página solicitada (Outlet)
  //    Si NO hay token, redirige al usuario a la página de login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;