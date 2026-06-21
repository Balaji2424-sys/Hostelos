'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from './api';

interface User { id: string; name: string; email: string; role: string; }
interface AuthCtx { user: User | null; token: string | null; login: (e: string, p: string) => Promise<void>; logout: () => void; loading: boolean; }

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('hostel_token');
    const u = localStorage.getItem('hostel_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const { token, user } = res.data;
    localStorage.setItem('hostel_token', token);
    localStorage.setItem('hostel_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('hostel_token');
    localStorage.removeItem('hostel_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
