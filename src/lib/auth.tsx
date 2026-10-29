import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/restaurant';
import { api } from './api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email?: string; password?: string; demo_role?: string }) => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isKitchen: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('demo_restaurant_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('demo_restaurant_token');
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('demo_restaurant_user', JSON.stringify(user));
      } catch {}
    } else {
      localStorage.removeItem('demo_restaurant_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem('demo_restaurant_token', token);
      } catch {}
    } else {
      localStorage.removeItem('demo_restaurant_token');
    }
  }, [token]);

  const login = async (credentials: { email?: string; password?: string; demo_role?: string }) => {
    setIsLoading(true);
    try {
      const result = await api.login(credentials);
      setUser(result.user);
      setToken(result.token);
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    await login({ demo_role: role });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('demo_restaurant_user');
    localStorage.removeItem('demo_restaurant_token');
  };

  const role = user?.role;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isKitchen = role === 'kitchen';
  const isStaff = Boolean(user && user.is_active);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        quickDemoLogin,
        logout,
        isAdmin,
        isManager,
        isKitchen,
        isStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
