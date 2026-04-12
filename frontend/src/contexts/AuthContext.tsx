import React, { createContext, useContext, useState } from "react";
import { authService } from "@/services/auth";
import { setToken, removeToken } from "@/lib/api";

export type UserRole = "docente" | "aluno_ativo" | "alumni";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_admin: boolean;
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
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role as UserRole,
        is_admin: res.user.is_admin ?? false,
        avatar: res.user.avatar ?? undefined,
        initials: res.user.initials,
      };
      setUser(userData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("pending") || msg.includes("rejected")) {
        throw err;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
    sessionStorage.removeItem(SESSION_KEY);
  };

  const isAdmin = user?.is_admin ?? false;

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
