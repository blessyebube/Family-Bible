import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  is_admin?: number;
  is_verified?: number;
  is_unlocked?: number;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = (userData: User) => setUser(userData);
  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => setUser(null));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
