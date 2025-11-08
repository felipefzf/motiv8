import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// 1. Crea el Contexto
const AuthContext = createContext(null);

// 2. Crea el "Proveedor"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);  
  // (Optimización: 'useState' con una función para leer localStorage 
  //  solo una vez al inicio, en lugar de en cada render)
  const [token, setToken] = useState(() => localStorage.getItem('firebaseToken'));
  
  const [isLoading, setIsLoading] = useState(true);

  // 3. Función de Logout (ahora memorizada con useCallback)
  // Esta función nunca cambiará, por eso el array de dependencias [] está vacío.
  const logout = useCallback(() => {
    // (Aquí puedes añadir la lógica de 'signOut(auth)' de firebase)
    localStorage.removeItem('firebaseToken');
    // localStorage.removeItem('userRole'); // Correcto, ya no se necesita
    setUser(null);
    setToken(null);
  }, []); // <-- Dependencias vacías

  // 4. Función para buscar datos (ahora memorizada)
  // Esta función solo se re-creará si la función 'logout' cambia (que nunca lo hará)
  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await fetch('/api/auth/me', { // Asumiendo proxy
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData); 
      } else {
        logout(); // Token inválido o expirado
      }
    } catch (e) {
      console.error("Error fetching user data", e);
      logout(); // Limpia si hay error
    } finally {
      setIsLoading(false);
    }
  }, [logout]); // <-- Depende de 'logout'

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('firebaseToken');
    if (currentToken) {
      await fetchUserData(currentToken); // Llama a fetchUserData para actualizar
    }
  }, [fetchUserData]);

  const updateUserTeamStatus = (teamId) => {
    if (user) {
      setUser({
        ...user,
        team_member: true, // <-- El cambio
        id_team: teamId,   // <-- El cambio
      });
    }
  };

  // 5. useEffect (ahora con dependencias correctas)
  useEffect(() => {
    if (token) {
      // Si hay token, busca los datos del usuario
      fetchUserData(token);
    } else {
      // Si no hay token, no estamos logueados
      setIsLoading(false);
    }
    // Este efecto se ejecuta si 'token' o 'fetchUserData' cambian.
  }, [token, fetchUserData]); 

  // 6. El valor que compartimos (ahora incluye la función 'login')
  const value = {
    user,
    token,
    isLoading,
    refreshUser, // Añade la función para refrescar el usuario
    login: (token, userData) => { // Función para usar en LoginPage
      localStorage.setItem('firebaseToken', token);
      setToken(token);
      setUser(userData);
    },
    logout, // Pasa la versión memorizada de 'logout'
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