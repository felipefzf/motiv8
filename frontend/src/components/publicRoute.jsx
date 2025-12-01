import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  
  const token = localStorage.getItem('firebaseToken');
  
  
  const role = localStorage.getItem('userRole');
  
  
  const redirectPath = role === 'admin' ? '/' : '/';

  
  return token ? <Navigate to={redirectPath} replace /> : <Outlet />;
};

export default PublicRoute;