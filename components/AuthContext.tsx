import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = await authApi.getStatus();
      setIsAdmin(status.isAdmin);
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string) => {
    try {
      const result = await authApi.login(password);
      setIsAdmin(result.isAdmin);
      console.log('✅ Login successful, isAdmin:', result.isAdmin);
    } catch (error) {
      console.error('❌ Login failed:', error);
      setIsAdmin(false);
      throw error;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
