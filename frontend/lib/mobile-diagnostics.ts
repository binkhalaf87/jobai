// Types and pure utilities for the mobile diagnostics panel

export type DiagStatus = "idle" | "running" | "pass" | "fail" | "warn";
export type LogLevel = "info" | "success" | "warn" | "error";
export type Platform = "ios" | "android" | "web";
export type PushPermStatus = "granted" | "denied" | "prompt" | "unknown";
export type PushRegStatus = "unregistered" | "pending" | "registered" | "failed";

// ─── Log ─────────────────────────────────────────────────────────────────────

export interface DiagLog {
  id: string;
  ts: number;
  level: LogLevel;
  section: string;
  message: string;
  detail?: string;
}

export function makeLog(
  level: LogLevel,
  section: string,
  message: string,
  detail?: string,
): DiagLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    level,
    section,
    message,
    detail,
  };
}

// ─── Section 1: Device ───────────────────────────────────────────────────────

export interface DeviceInfo {
  platform: Platform;
  model: string;
  manufacturer: string;
  osVersion: string;
  appVersion: string;
  capacitorVersion: string;
  screenWidth: number;
  screenHeight: number;
  isOnline: boolean;
  userAgent: string;
  isNative: boolean;
}

// ─── Section 2: Push ─────────────────────────────────────────────────────────

export interface PushState {
  permStatus: PushPermStatus;
  regStatus: PushRegStatus;
  fcmToken: string | null;
  lastRegTs: number | null;
  error: string | null;
  loading: boolean;
}

// ─── Section 3: Local Notification ───────────────────────────────────────────

export interface NotifTestResult {
  status: DiagStatus;
  sentTs: number | null;
  delivered: boolean;
  error: string | null;
}

// ─── Section 4: Deep Links ───────────────────────────────────────────────────

export interface DeepLinkTest {
  key: string;
  label: string;
  path: string;
  status: DiagStatus;
}

export interface DeepLinkState {
  currentUrl: string;
  lastOpenedLink: string | null;
  detectedRoute: string | null;
  appLinksOk: boolean | null;
  tests: DeepLinkTest[];
}

export const DEEP_LINK_TESTS: Omit<DeepLinkTest, "status">[] = [
  { key: "dashboard", label: "Open Dashboard",        path: "/dashboard" },
  { key: "profile",   label: "Open Profile",          path: "/dashboard/profile" },
  { key: "analysis",  label: "Open Resume Analyzer",  path: "/dashboard/analysis" },
  { key: "jobs",      label: "Open Jobs Page",         path: "/dashboard/job-search" },
];

// ─── Section 5: File Upload ───────────────────────────────────────────────────

export interface UploadTest {
  type: "pdf" | "docx" | "image" | "camera";
  label: string;
  accept: string;
  capture?: "environment" | "user";
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  durationMs: number | null;
  status: DiagStatus;
  error: string | null;
}

export const UPLOAD_TESTS: Omit<UploadTest, "fileName" | "fileSize" | "mimeType" | "durationMs" | "status" | "error">[] = [
  { type: "pdf",    label: "PDF Upload",     accept: "application/pdf" },
  { type: "docx",   label: "DOCX Upload",    accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" },
  { type: "image",  label: "Image Upload",   accept: "image/jpeg,image/png,image/webp" },
  { type: "camera", label: "Camera Capture", accept: "image/*",  capture: "environment" },
];

const VALID_MIME: Record<string, string[]> = {
  pdf:    ["application/pdf"],
  docx:   ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"],
  image:  ["image/jpeg", "image/png", "image/webp", "image/gif"],
  camera: ["image/jpeg", "image/png", "image/webp"],
};

export function isValidMime(type: UploadTest["type"], mime: string): boolean {
  return VALID_MIME[type]?.some((m) => mime.startsWith(m)) ?? true;
}

// ─── Section 6: Auth ─────────────────────────────────────────────────────────

export interface AuthChecks {
  loginPersist:    DiagStatus;
  tokenRefresh:    DiagStatus;
  protectedAccess: DiagStatus;
}

export interface AuthDiag {
  isLoggedIn:    boolean;
  sessionStatus: "active" | "expired" | "unknown";
  jwtPresent:    boolean;
  cookieCount:   number;
  testStatus:    DiagStatus;
  testDetail:    string | null;
  checks:        AuthChecks;
}

// ─── Section 7: API Connectivity ─────────────────────────────────────────────

export interface ApiEndpointDef {
  name:   string;
  url:    string;
  method: string;
}

export interface ApiEndpointResult extends ApiEndpointDef {
  statusCode:     number | null;
  responseTimeMs: number | null;
  available:      boolean;
  error:          string | null;
}

export const API_ENDPOINT_DEFS: ApiEndpointDef[] = [
  { name: "Frontend",         url: "/",                    method: "GET"  },
  { name: "Backend API",      url: "/api/v1/auth/me",      method: "GET"  },
  { name: "Auth Endpoint",    url: "/api/v1/auth/refresh", method: "POST" },
  { name: "Payment Endpoint", url: "/api/v1/billing/plans",method: "GET"  },
  { name: "Resume Endpoint",  url: "/api/v1/resumes",      method: "GET"  },
];

// ─── Section 8: Health Score ─────────────────────────────────────────────────

export interface HealthScore {
  total:             number;
  pushNotifications: number;
  deepLinks:         number;
  uploads:           number;
  authentication:    number;
  apiConnectivity:   number;
  label:  "Ready For Production" | "Needs Review" | "Not Ready";
  color:  "green" | "yellow" | "red";
}

export function calcHealthScore(
  pushPerm:    PushPermStatus,
  dlTests:     DeepLinkTest[],
  uploadTests: UploadTest[],
  auth:        AuthDiag,
  apiResults:  ApiEndpointResult[],
): HealthScore {
  // Push: 20 pts
  const pushNotifications =
    pushPerm === "granted" ? 20 :
    pushPerm === "prompt"  ? 10 : 0;

  // Deep links: 20 pts
  const dlPassed = dlTests.filter((t) => t.status === "pass").length;
  const deepLinks = dlTests.length > 0
    ? Math.round((dlPassed / dlTests.length) * 20)
    : 0;

  // Uploads: 20 pts
  const upPassed = uploadTests.filter((t) => t.status === "pass").length;
  const uploads = uploadTests.length > 0
    ? Math.round((upPassed / uploadTests.length) * 20)
    : 0;

  // Auth: 20 pts
  let authentication = 0;
  if (auth.isLoggedIn)                           authentication += 8;
  if (auth.checks.loginPersist    === "pass")    authentication += 4;
  if (auth.checks.tokenRefresh    === "pass")    authentication += 4;
  if (auth.checks.protectedAccess === "pass")    authentication += 4;
  authentication = Math.min(authentication, 20);

  // API: 20 pts
  const apiPassed = apiResults.filter((r) => r.available).length;
  const apiConnectivity = apiResults.length > 0
    ? Math.round((apiPassed / apiResults.length) * 20)
    : 0;

  const total = pushNotifications + deepLinks + uploads + authentication + apiConnectivity;

  return {
    total,
    pushNotifications,
    deepLinks,
    uploads,
    authentication,
    apiConnectivity,
    label: total >= 90 ? "Ready For Production" : total >= 70 ? "Needs Review" : "Not Ready",
    color: total >= 90 ? "green" : total >= 70 ? "yellow" : "red",
  };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatTs(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
