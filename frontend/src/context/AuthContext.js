'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ig_token');
    const username = localStorage.getItem('ig_username');
    if (token && username) setAdmin({ token, username });
    setChargement(false);
  }, []);

  const login = (token, username) => {
    localStorage.setItem('ig_token', token);
    localStorage.setItem('ig_username', username);
    setAdmin({ token, username });
  };

  const logout = () => {
    localStorage.removeItem('ig_token');
    localStorage.removeItem('ig_username');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, chargement }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
