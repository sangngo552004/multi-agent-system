"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";
const REQUEST_TIMEOUT_MS = 20_000;

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

export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly status: number,
  ) {
    super(getSafeApiErrorMessage(code, status));
    this.name = "ApiError";
  }
}

function getSafeApiErrorMessage(code: number, status: number) {
  if (code === 1004) return "Email hoặc mật khẩu không đúng.";
  if (code === 1012) {
    return "Tài khoản đang tạm khóa do đăng nhập sai nhiều lần.";
  }
  if (code === 1013) return "Tài khoản hiện không hoạt động.";
  if (code === 1015 || status === 429) {
    return "Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.";
  }
  if (status === 401) return "Phiên đăng nhập đã hết hạn.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 404) return "Không tìm thấy dữ liệu được yêu cầu.";
  if (status === 409) {
    return "Dữ liệu đã thay đổi hoặc đang được sử dụng. Vui lòng tải lại.";
  }
  if (status >= 500) {
    return "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau.";
  }
  return "Yêu cầu chưa hợp lệ. Vui lòng kiểm tra và thử lại.";
}

export function shouldRetryApiRequest(failureCount: number, error: unknown) {
  if (error instanceof ApiError) {
    return error.status >= 500 && failureCount < 1;
  }
  return failureCount < 1;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function notifySessionExpired() {
  setAccessToken(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = request<{ token: string }>("/api/v1/auth/refresh", {
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
    try {
      await refreshAccessToken();
    } catch (error) {
      notifySessionExpired();
      throw error;
    }
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
      try {
        await refreshAccessToken();
      } catch (refreshError) {
        notifySessionExpired();
        throw refreshError;
      }
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
    signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!response.ok || !payload || payload.code !== 1000) {
    throw new ApiError(
      payload?.code ?? response.status,
      response.status,
    );
  }
  return payload.result;
}
