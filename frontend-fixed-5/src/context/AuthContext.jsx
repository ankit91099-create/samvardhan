import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, getToken, removeToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session from existing access token
  useEffect(() => {
    const restore = async () => {
      if (!getToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await authAPI.getProfile();
        setAdmin(profile);
      } catch {
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setAdmin(data.admin);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setAdmin(null);
      removeToken();
    }
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
