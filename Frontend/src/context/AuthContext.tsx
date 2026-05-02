import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API = 'http://localhost:8081';

interface User {
  email: string;
  username: string;
  token: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Load user from localStorage on startup — survives page refresh
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('coinstrove_user');
      if (!saved) return null;
      const parsed: User = JSON.parse(saved);
      // Check token is not expired before restoring session
      const payload = JSON.parse(atob(parsed.token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem('coinstrove_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('coinstrove_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('coinstrove_user');
    }
  }, [user]);

  const register = async (email: string, username: string, password: string) => {
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Registration failed.' };
      setUser({ email: data.email, username: data.username, token: data.token });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot reach the server. Make sure the backend is running.' };
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Login failed.' };
      setUser({ email: data.email, username: data.username, token: data.token });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot reach the server. Make sure the backend is running.' };
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};