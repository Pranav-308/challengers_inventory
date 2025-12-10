import React, { createContext, useState, useContext, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  useEffect(() => {
    // Check for stored user on mount (check both storage types)
    const storedUserLocal = localStorage.getItem('user');
    const tokenLocal = localStorage.getItem('token');
    const storedUserSession = sessionStorage.getItem('user');
    const tokenSession = sessionStorage.getItem('token');
    
    if (storedUserLocal && tokenLocal) {
      setUser(JSON.parse(storedUserLocal));
      setUsingLocalStorage(true);
    } else if (storedUserSession && tokenSession) {
      setUser(JSON.parse(storedUserSession));
      setUsingLocalStorage(false);
    }
    setLoading(false);
  }, []);

  const login = async (credentials, rememberMe = false) => {
    try {
      console.log('Attempting login with:', credentials.username, 'Remember Me:', rememberMe);
      
      // Send rememberMe to backend
      const response = await api.login({ ...credentials, rememberMe });
      console.log('Login response:', response.data);
      const userData = response.data;
      
      // Clear both storages first to avoid conflicts
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('sessionId');
      
      // Use localStorage if "Remember Me" is checked, otherwise use sessionStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', userData.token);
      storage.setItem('user', JSON.stringify(userData));
      storage.setItem('sessionId', userData.sessionId);
      storage.setItem('rememberMe', rememberMe.toString());
      
      setUser(userData);
      setUsingLocalStorage(rememberMe);
      
      console.log(`✅ Stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const logout = () => {
    // Clear both storage types
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('rememberMe');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    // Use the same storage type that was used during login
    const storage = usingLocalStorage ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
