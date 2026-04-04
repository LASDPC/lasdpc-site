import React, { createContext, useContext, useState } from "react";
import { authService } from "@/services/auth";
import { setToken, removeToken } from "@/lib/api";

export type UserRole = "admin" | "normal";

export interface User {
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const SESSION_KEY = "lasdpc-auth-user";

function loadSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  login: async () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(loadSession);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authService.login(email, password);
      setToken(res.access_token);
      const userData: User = {
        email: res.user.email,
        name: res.user.name,
        role: res.user.role as UserRole,
        avatar: res.user.avatar ?? undefined,
        initials: res.user.initials,
      };
      setUser(userData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
    sessionStorage.removeItem(SESSION_KEY);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
