import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  // 1. Revisa si hay un token en localStorage
  const token = localStorage.getItem('firebaseToken');
  
  // 2. (Opcional) Revisa el rol para saber a dónde redirigir
  const role = localStorage.getItem('userRole');
  
  // 3. Decide a dónde redirigir si el usuario YA está logueado
  const redirectPath = role === 'admin' ? '/' : '/';

  // Si hay un token, redirige al usuario fuera del login.
  // Si NO hay token, muestra la ruta (Outlet), es decir, el Login.
  return token ? <Navigate to={redirectPath} replace /> : <Outlet />;
};

export default PublicRoute;