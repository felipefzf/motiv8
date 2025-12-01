import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import API_URL from '../config'; 

// 1. Crea el Contexto
const AuthContext = createContext(null);

// 2. Crea el "Proveedor"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);  
  
  const [token, setToken] = useState(() => localStorage.getItem('firebaseToken'));
  
  const [isLoading, setIsLoading] = useState(true);

  // 3. Función de Logout 
  
  const logout = useCallback(() => {
   
    localStorage.removeItem('firebaseToken');
   
    setUser(null);
    setToken(null);
  }, []); 

  // 4. Función para buscar datos 
 
  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData); 
      } else {
        logout(); 
      }
    } catch (e) {
      console.error("Error fetching user data", e);
      logout(); 
    } finally {
      setIsLoading(false);
    }
  }, [logout]); 

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('firebaseToken');
    if (currentToken) {
      await fetchUserData(currentToken); 
    }
  }, [fetchUserData]);

  const updateUserTeamStatus = (teamId) => {
    if (user) {
      setUser({
        ...user,
        team_member: true, 
        id_team: teamId,   
      });
    }
  };

 
  useEffect(() => {
    if (token) {
     
      fetchUserData(token);
    } else {
     
      setIsLoading(false);
    }
    
  }, [token, fetchUserData]); 

 
  const value = {
    user,
    token,
    isLoading,
    refreshUser, 
    login: (token, userData) => { 
      localStorage.setItem('firebaseToken', token);
      setToken(token);
      setUser(userData);
    },
    logout, 
    updateUserTeamStatus,
  };

  // 7. No mostramos la app hasta saber si estamos logueados o no
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

// 8. El Hook (sin cambios)
export const useAuth = () => {
  return useContext(AuthContext);
};