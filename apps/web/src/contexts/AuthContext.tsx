'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, User } from '@/lib/api';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const data = await authApi.me();
        setUser(data.user);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      Cookies.remove('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email, password });
      setUser(data.user);
      Cookies.set('token', data.token, { expires: 7 });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const data = await authApi.register({ email, password, name });
      setUser(data.user);
      Cookies.set('token', data.token, { expires: 7 });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    Cookies.remove('token');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}