import React, { createContext, useContext, useState } from "react";

interface User {
  email: string;
  name: string;
  role: "admin";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const ADMIN_EMAIL = "admin@lasdpc.usp.br";
const ADMIN_PASSWORD = "lasdpc2024";

const AuthContext = createContext<AuthContextType>({ user: null, login: () => false, logout: () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setUser({ email: ADMIN_EMAIL, name: "Admin LASDPC", role: "admin" });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
