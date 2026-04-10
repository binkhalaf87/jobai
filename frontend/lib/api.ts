import { publicConfig } from "@/lib/config";

const AUTH_TOKEN_KEY = "jobai_access_token";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
  auth?: boolean;
};

type UploadRequestOptions = {
  auth?: boolean;
  onProgress?: (progress: number) => void;
};


function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}


export function setApiToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}


export function clearApiToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}


export function hasApiToken(): boolean {
  return Boolean(getStoredToken());
}


export function getApiBaseUrl(): string {
  return publicConfig.apiUrl;
}


async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}


function normalizeBody(body: ApiRequestOptions["body"]): BodyInit | null | undefined {
  if (body == null) {
    return body;
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body;
  }

  return JSON.stringify(body);
}


function buildHeaders(body: ApiRequestOptions["body"], auth: boolean, headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers);
  const token = getStoredToken();

  if (body != null && !(body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth && token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return requestHeaders;
}


export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;
  const response = await fetch(`${publicConfig.apiUrl}${path}`, {
    ...rest,
    headers: buildHeaders(body, auth, headers),
    body: normalizeBody(body)
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}


export function uploadRequest<T>(path: string, formData: FormData, options: UploadRequestOptions = {}): Promise<T> {
  const { auth = false, onProgress } = options;

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${getApiBaseUrl()}${path}`);
    request.responseType = "json";

    const token = getStoredToken();
    if (auth && token) {
      request.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("load", () => {
      const responseData = request.response as T | { detail?: string } | null;

      if (request.status >= 200 && request.status < 300) {
        resolve((responseData ?? {}) as T);
        return;
      }

      const detail =
        responseData && typeof responseData === "object" && "detail" in responseData
          ? responseData.detail || "Request failed."
          : "Request failed.";
      reject(new ApiError(request.status, detail));
    });

    request.addEventListener("error", () => {
      reject(new ApiError(0, "Network error while uploading the file."));
    });

    request.send(formData);
  });
}


export const api = {
  get<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: ApiRequestOptions["body"], options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },
  put<T>(path: string, body?: ApiRequestOptions["body"], options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },
  patch<T>(
    path: string,
    body?: ApiRequestOptions["body"],
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },
  delete<T>(
    path: string,
    body?: ApiRequestOptions["body"],
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return apiRequest<T>(path, { ...options, method: "DELETE", body });
  },
  upload<T>(path: string, formData: FormData, options: UploadRequestOptions = {}) {
    return uploadRequest<T>(path, formData, options);
  }
};
