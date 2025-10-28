// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  // Revisa el rol guardado en el localStorage
  const { user, isLoading } = useAuth();

  // 3. Muestra "Cargando..." mientras el contexto verifica el token
  if (isLoading) {
    return <p>Cargando...</p>; // O un componente <Spinner />
  }

  // 4. Revisa el rol del objeto 'user'
  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;