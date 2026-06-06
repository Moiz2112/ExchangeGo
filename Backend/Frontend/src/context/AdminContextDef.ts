import { createContext } from 'react';

export interface AdminUser {
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
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface DashboardStats {
  active_exchanges: number;
  total_exchanges: number;
  active_coins: number;
  total_coins: number;
  total_users: number;
  total_messages: number;
  unread_messages: number;
}

export interface FeaturedCoin {
  id: number;
  category: string;
  ticker: string;
}

export interface AdminContextType {
  isLoggedIn: boolean;
  admin: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

export const AdminContext = createContext<AdminContextType | null>(null);
