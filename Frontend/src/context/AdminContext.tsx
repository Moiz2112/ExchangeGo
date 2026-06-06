import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

const API = 'http://localhost:8081';

interface AdminUser {
  username: string;
  token: string;
}

export interface Exchange {
  id: number;
  name: string;
  slug: string;
  api_endpoint: string;
  enabled: boolean;
  created_at: string;
}

export interface Coin {
  id: number;
  ticker: string;
  name: string;
  emoji: string;
  color: string;
  display_order: number;
  enabled: boolean;
  created_at: string;
}

export interface UserRecord {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  resolved: boolean;
  created_at: string;
}

export interface FeaturedCoin {
  id: number;
  ticker: string;
  category: string;
}

export interface DashboardStats {
  total_exchanges: number;
  active_exchanges: number;
  total_coins: number;
  total_users: number;
  total_messages: number;
  unread_messages: number;
  featured_coins: number;
  server_time: string;
}

interface AdminContextType {
  isLoggedIn: boolean;
  admin: AdminUser | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  // API helpers
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('coinstrove_admin') ?? localStorage.getItem('exchangego_admin');
      if (!saved) return null;
      const parsed: AdminUser = JSON.parse(saved);
      const payload = JSON.parse(atob(parsed.token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem('coinstrove_admin');
        localStorage.removeItem('exchangego_admin');
        return null;
      }
      return parsed;
    } catch { return null; }
  });

  useEffect(() => {
    if (admin) localStorage.setItem('coinstrove_admin', JSON.stringify(admin));
    else {
      localStorage.removeItem('coinstrove_admin');
      localStorage.removeItem('exchangego_admin');
    }
  }, [admin]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Login failed.' };
      setAdmin({ username: data.username, token: data.token });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot reach the server.' };
    }
  };

  const logout = () => setAdmin(null);

  const apiFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    return fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${admin?.token ?? ''}`,
        ...(opts.headers || {}),
      },
    });
  }, [admin]);

  return (
    <AdminContext.Provider value={{ isLoggedIn: !!admin, admin, login, logout, apiFetch }}>
      {children}
    </AdminContext.Provider>
  );
};

export { AdminContext };
