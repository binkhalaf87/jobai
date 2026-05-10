import { getRequiredPublicApiUrl } from "@/lib/config";

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
};

type UploadRequestOptions = {
  onProgress?: (progress: number) => void;
};

export function getApiBaseUrl(): string {
  return getRequiredPublicApiUrl();
}

function createApiConnectionError(baseUrl: string): Error {
  return new Error(`Unable to reach the API at ${baseUrl}. Check that the backend is running and reachable.`);
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string | Array<{ msg: string }> };
    if (Array.isArray(payload.detail)) {
      return payload.detail.map((e) => e.msg).join(" ") || `Request failed (${response.status}).`;
    }
    return payload.detail ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
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

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

function buildHeaders(
  body: ApiRequestOptions["body"],
  method: string | undefined,
  headers?: HeadersInit
): Headers {
  const requestHeaders = new Headers(headers);

  if (body != null && !(body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!CSRF_SAFE_METHODS.has((method ?? "GET").toUpperCase())) {
    const csrf = getCsrfToken();
    if (csrf) {
      requestHeaders.set("X-CSRF-Token", csrf);
    }
  }

  return requestHeaders;
}


export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, method, ...rest } = options;
  const baseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      method,
      credentials: "include",
      headers: buildHeaders(body, method, headers),
      body: normalizeBody(body),
    });
  } catch {
    throw createApiConnectionError(baseUrl);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}


export async function fetchStream(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { body, headers, method, ...rest } = options;
  const baseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      method,
      credentials: "include",
      headers: buildHeaders(body, method, headers),
      body: normalizeBody(body),
    });
  } catch {
    throw createApiConnectionError(baseUrl);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  return response;
}


export function uploadRequest<T>(path: string, formData: FormData, options: UploadRequestOptions = {}): Promise<T> {
  const { onProgress } = options;
  const baseUrl = getApiBaseUrl();

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${baseUrl}${path}`);
    request.responseType = "json";
    request.withCredentials = true;

    const csrf = getCsrfToken();
    if (csrf) {
      request.setRequestHeader("X-CSRF-Token", csrf);
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
      reject(createApiConnectionError(baseUrl));
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
  },
};
