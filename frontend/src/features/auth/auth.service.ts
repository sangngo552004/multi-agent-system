"use client";

import type { AuthUser, LoginInput } from "@/features/auth/auth.types";
import {
  apiRequest,
  refreshAccessToken,
  setAccessToken,
} from "@/services/http/api-client";

type AuthTokenResponse = {
  token: string;
  userId: string;
  email: string;
  role: AuthUser["role"];
};

export const authService = {
  async login(input: LoginInput) {
    const auth = await apiRequest<AuthTokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      authenticated: false,
    });
    setAccessToken(auth.token);
    return this.me();
  },

  me() {
    return apiRequest<AuthUser>("/api/v1/auth/me");
  },

  async restore() {
    await refreshAccessToken();
    return this.me();
  },

  async logout() {
    try {
      await apiRequest<void>("/api/v1/auth/logout", {
        method: "POST",
        authenticated: false,
      });
    } finally {
      setAccessToken(null);
    }
  },
};
