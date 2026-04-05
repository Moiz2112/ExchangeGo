import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/config';

interface User { username: string; email: string; token: string; }
interface AuthCtx {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(val => {
      if (val) setUser(JSON.parse(val));
    });
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Login failed' };
      const u = { username: data.username, email: data.email, token: data.token };
      setUser(u);
      await AsyncStorage.setItem('user', JSON.stringify(u));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Registration failed' };
      const u = { username: data.username, email: data.email, token: data.token };
      setUser(u);
      await AsyncStorage.setItem('user', JSON.stringify(u));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}