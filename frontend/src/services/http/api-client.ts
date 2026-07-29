"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  result: T;
};

type RequestOptions = RequestInit & {
  authenticated?: boolean;
  retryOnUnauthorized?: boolean;
};

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = request<{ token: string }>("/api/auth/refresh", {
      method: "POST",
      authenticated: false,
      retryOnUnauthorized: false,
    })
      .then((auth) => {
        setAccessToken(auth.token);
        return auth.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    retryOnUnauthorized = true,
    ...fetchOptions
  } = options;

  if (authenticated && !accessToken) {
    await refreshAccessToken();
  }

  const headers = new Headers(fetchOptions.headers);
  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    return await request<T>(path, {
      ...fetchOptions,
      headers,
      authenticated: false,
      retryOnUnauthorized: false,
    });
  } catch (error) {
    if (
      authenticated &&
      retryOnUnauthorized &&
      error instanceof ApiError &&
      error.status === 401
    ) {
      setAccessToken(null);
      await refreshAccessToken();
      return apiRequest<T>(path, {
        ...fetchOptions,
        authenticated: true,
        retryOnUnauthorized: false,
      });
    }
    throw error;
  }
}

async function request<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!response.ok || !payload || payload.code !== 1000) {
    throw new ApiError(
      payload?.message ?? "Không thể kết nối đến máy chủ.",
      payload?.code ?? response.status,
      response.status,
    );
  }
  return payload.result;
}
