"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "./supabase";

const FALLBACK_PIN = "1234";
const STORAGE_KEY = "workflow_auth";

interface AuthContextType {
  isManager: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  refreshPin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isManager: false,
  login: () => false,
  logout: () => {},
  refreshPin: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isManager, setIsManager] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dbPin, setDbPin] = useState<string | null>(null);

  const loadPin = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "admin_pin")
        .single();
      if (!error && data) {
        setDbPin(data.value);
      }
    } catch {
      // settings table may not exist yet, fall back to hardcoded
    }
  }, []);

  useEffect(() => {
    loadPin();
  }, [loadPin]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "manager") {
      setIsManager(true);
    }
    setLoaded(true);
  }, []);

  const login = (pin: string): boolean => {
    const currentPin = dbPin || FALLBACK_PIN;
    if (pin === currentPin) {
      setIsManager(true);
      localStorage.setItem(STORAGE_KEY, "manager");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsManager(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Don't render until localStorage is checked (prevents flash)
  if (!loaded) return null;

  return (
    <AuthContext.Provider value={{ isManager, login, logout, refreshPin: loadPin }}>
      {children}
    </AuthContext.Provider>
  );
}
