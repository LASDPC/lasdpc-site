import React, { createContext, useContext, useState } from "react";

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
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const MOCK_USERS: (User & { password: string })[] = [
  {
    email: "admin@lasdpc.usp.br",
    password: "lasdpc2024",
    name: "Admin LASDPC",
    role: "admin",
    initials: "AL",
  },
  {
    email: "joao.silva@usp.br",
    password: "usuario123",
    name: "João Silva",
    role: "normal",
    avatar: "https://i.pravatar.cc/150?u=joao.silva@usp.br",
    initials: "JS",
  },
  {
    email: "maria.santos@usp.br",
    password: "senha456",
    name: "Maria Santos",
    role: "normal",
    avatar: "https://i.pravatar.cc/150?u=maria.santos@usp.br",
    initials: "MS",
  },
];

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
  login: () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(loadSession);

  const login = (email: string, password: string): boolean => {
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
