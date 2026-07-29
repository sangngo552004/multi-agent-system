export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // In a real app, you would inject the JWT token here
  // const token = getCookie('token');
  // options.headers = { ...options.headers, Authorization: `Bearer ${token}` };

  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = "Đã có lỗi xảy ra.";
    try {
      const data = await response.json();
      errorCode = data.error_code || data.code || errorCode;
      errorMessage = data.message || errorMessage;
    } catch (_e) {
      errorMessage = response.statusText;
    }
    throw new ApiError(errorMessage, response.status, errorCode);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
