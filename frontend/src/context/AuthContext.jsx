import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('aura_ner_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.role) {
          return parsed;
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const login = async (username, password) => {
    try {
      const res = await api.login(username, password);
      const data = res.data;
      const userObj = {
        role: data.role,
        name: data.fullName || data.username,
        username: data.username,
        fullName: data.fullName,
        state: data.state || 'Assam',
        district: data.district || 'Kamrup Metropolitan',
      };
      setToken(data.token);
      setCurrentUser(userObj);
      localStorage.setItem('token', data.token);
      localStorage.setItem('aura_ner_user', JSON.stringify(userObj));
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid username or password.',
      };
    }
  };

  const register = async (userData) => {
    try {
      await api.register(userData);
      // Automatically log in after registration
      return await login(userData.username, userData.password);
    } catch (err) {
      console.error('Register error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Check role verification code.',
      };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('aura_ner_user');
  };

  const hasRole = (...roles) => {
    if (!currentUser || !currentUser.role) return false;
    return roles.includes(currentUser.role);
  };

  const value = {
    currentUser,
    token,
    login,
    register,
    logout,
    hasRole,
    isAdmin: hasRole('ROLE_ADMIN'),
    isDisasterOfficer: hasRole('ROLE_DISASTER_OFFICER', 'ROLE_ADMIN'),
    isTransporter: hasRole('ROLE_TRANSPORTER', 'ROLE_ADMIN'),
    isFieldEngineer: hasRole('ROLE_FIELD_ENGINEER', 'ROLE_ADMIN'),
    isGuest: !currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
