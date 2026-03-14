import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi } from '../services/api';
import { User, UserRegistrationData } from '../types';

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  user: User | null;
  isLoggedIn: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  userLogin: (email: string, password: string) => Promise<void>;
  userRegister: (data: UserRegistrationData) => Promise<void>;
  userLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [adminStatus, userStatus] = await Promise.all([
        authApi.getStatus(),
        userApi.getStatus(),
      ]);
      setIsAdmin(adminStatus.isAdmin);
      if (userStatus.isLoggedIn && userStatus.user) {
        setUser(userStatus.user);
      }
    } catch (error) {
      setIsAdmin(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string) => {
    try {
      const result = await authApi.login(password);
      setIsAdmin(result.isAdmin);
    } catch (error) {
      setIsAdmin(false);
      throw error;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setIsAdmin(false);
  };

  const userLogin = async (email: string, password: string) => {
    const result = await userApi.login(email, password);
    setUser(result.user);
  };

  const userRegister = async (data: UserRegistrationData) => {
    const result = await userApi.register(data);
    setUser(result.user);
  };

  const userLogout = async () => {
    await userApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAdmin, isLoading, user, isLoggedIn: !!user,
      login, logout, userLogin, userRegister, userLogout
    }}>
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
