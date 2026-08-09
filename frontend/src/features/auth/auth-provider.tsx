"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/auth/auth.service";
import type { AuthUser, LoginInput } from "@/features/auth/auth.types";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  setAccessToken,
} from "@/services/http/api-client";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  candidateLogin: (input: LoginInput) => Promise<AuthUser>;
  hrLogin: (input: LoginInput) => Promise<AuthUser>;
  adminLogin: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const expireSession = () => {
      queryClient.clear();
      setUser(null);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession);
    authService
      .restore()
      .then((restoredUser) => {
        if (active) setUser(restoredUser);
      })
      .catch(() => {
        setAccessToken(null);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession);
    };
  }, [queryClient]);

  const candidateLogin = useCallback(async (input: LoginInput) => {
    const authenticatedUser = await authService.candidateLogin(input);
    queryClient.clear();
    setUser(authenticatedUser);
    return authenticatedUser;
  }, [queryClient]);

  const hrLogin = useCallback(async (input: LoginInput) => {
    const authenticatedUser = await authService.hrLogin(input);
    queryClient.clear();
    setUser(authenticatedUser);
    return authenticatedUser;
  }, [queryClient]);

  const adminLogin = useCallback(async (input: LoginInput) => {
    const authenticatedUser = await authService.adminLogin(input);
    queryClient.clear();
    setUser(authenticatedUser);
    return authenticatedUser;
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      queryClient.clear();
      setUser(null);
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isLoading, candidateLogin, hrLogin, adminLogin, logout }),
    [isLoading, candidateLogin, hrLogin, adminLogin, logout, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
