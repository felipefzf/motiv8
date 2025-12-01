import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const AdminRoute = () => {
  
  const { user, isLoading } = useAuth();

 
  if (isLoading) {
    return <p>Cargando...</p>; 
  }


  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;