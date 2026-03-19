const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, ...init } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...init,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Try to extract structured error from backend response envelope
    let message = `API error: ${response.statusText}`;
    let code: string | undefined;

    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error.message ?? message;
        code = errorBody.error.code;
      } else if (errorBody?.detail) {
        message = errorBody.detail;
      }
    } catch {
      // Response body wasn't JSON — use default message
    }

    throw new ApiError(response.status, message, code);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

/**
 * Create an API client pre-bound with a bearer token.
 * Used via the useApiClient hook to automatically attach the session token.
 */
export function createAuthenticatedClient(token: string) {
  return {
    get: <T>(endpoint: string, options?: Omit<RequestOptions, "token">) =>
      apiClient.get<T>(endpoint, { ...options, token }),

    post: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "token">) =>
      apiClient.post<T>(endpoint, body, { ...options, token }),

    put: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "token">) =>
      apiClient.put<T>(endpoint, body, { ...options, token }),

    patch: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, "token">) =>
      apiClient.patch<T>(endpoint, body, { ...options, token }),

    delete: <T>(endpoint: string, options?: Omit<RequestOptions, "token">) =>
      apiClient.delete<T>(endpoint, { ...options, token }),
  };
}
