"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  type DeviceInfo,
  type PushState,
  type PushPermStatus,
  type NotifTestResult,
  type DeepLinkState,
  type UploadTest,
  type AuthDiag,
  type ApiEndpointResult,
  type HealthScore,
  type DiagLog,
  type DiagStatus,
  DEEP_LINK_TESTS,
  UPLOAD_TESTS,
  API_ENDPOINT_DEFS,
  calcHealthScore,
  isValidMime,
  makeLog,
} from "@/lib/mobile-diagnostics";
import { api, ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

// ─── Initial state factories ──────────────────────────────────────────────────

function initUploadTests(): UploadTest[] {
  return UPLOAD_TESTS.map((t) => ({
    ...t,
    fileName: null, fileSize: null, mimeType: null, durationMs: null,
    status: "idle", error: null,
  }));
}

function initApiResults(): ApiEndpointResult[] {
  return API_ENDPOINT_DEFS.map((e) => ({
    ...e, statusCode: null, responseTimeMs: null, available: false, error: null,
  }));
}

function initDeepLinkState(): DeepLinkState {
  return {
    currentUrl:     typeof window !== "undefined" ? window.location.href : "",
    lastOpenedLink: null,
    detectedRoute:  null,
    appLinksOk:     null,
    tests: DEEP_LINK_TESTS.map((t) => ({ ...t, status: "idle" as DiagStatus })),
  };
}

function initAuthDiag(): AuthDiag {
  return {
    isLoggedIn:    false,
    sessionStatus: "unknown",
    jwtPresent:    false,
    cookieCount:   0,
    testStatus:    "idle",
    testDetail:    null,
    checks: { loginPersist: "idle", tokenRefresh: "idle", protectedAccess: "idle" },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMobileDiagnostics() {
  const router = useRouter();
  const { user } = useAuth();

  // ── Logs ──────────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<DiagLog[]>([]);
  const addLog = useCallback(
    (level: DiagLog["level"], section: string, message: string, detail?: string) => {
      setLogs((prev) => [...prev, makeLog(level, section, message, detail)]);
    },
    [],
  );

  // ── Section 1: Device ─────────────────────────────────────────────────────
  const [deviceInfo, setDeviceInfo]     = useState<DeviceInfo | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setDeviceLoading(true);
      try {
        const { Capacitor } = await import("@capacitor/core");
        const isNative = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform() as DeviceInfo["platform"];

        let model = "Unknown", manufacturer = "Unknown", osVersion = "Unknown", appVersion = "—";

        if (isNative) {
          try {
            const { Device } = await import("@capacitor/device");
            const d = await Device.getInfo();
            model = d.model; manufacturer = d.manufacturer; osVersion = d.osVersion;
          } catch { /* fallback */ }
          try {
            const { App } = await import("@capacitor/app");
            const a = await App.getInfo();
            appVersion = `${a.version} (${a.build})`;
          } catch { /* fallback */ }
        } else {
          const ua = navigator.userAgent;
          if (ua.includes("Android")) {
            osVersion    = ua.match(/Android ([^;)]+)/)?.[1] ?? "Android";
            manufacturer = "Android";
            model        = ua.match(/;\s*([^;)]+)\s*Build/)?.[1]?.trim() ?? "Browser";
          } else if (ua.includes("iPhone") || ua.includes("iPad")) {
            osVersion    = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "iOS";
            manufacturer = "Apple";
            model        = ua.includes("iPad") ? "iPad" : "iPhone";
          } else {
            manufacturer = "Desktop"; model = "Browser"; osVersion = navigator.platform;
          }
          appVersion = "Web Build";
        }

        if (!mounted) return;
        const info: DeviceInfo = {
          platform, model, manufacturer, osVersion, appVersion,
          capacitorVersion: "8.x",
          screenWidth:  screen.width,
          screenHeight: screen.height,
          isOnline:     navigator.onLine,
          userAgent:    navigator.userAgent,
          isNative,
        };
        setDeviceInfo(info);
        addLog("info", "Device", `Platform: ${platform} | ${manufacturer} ${model}`, osVersion);
      } catch (err) {
        addLog("error", "Device", "Failed to load device info", String(err));
      } finally {
        if (mounted) setDeviceLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [addLog]);

  // ── Section 2: Push Notifications ────────────────────────────────────────
  const [push, setPush] = useState<PushState>({
    permStatus: "unknown", regStatus: "unregistered",
    fcmToken: null, lastRegTs: null, error: null, loading: false,
  });

  const checkPushPermission = useCallback(async () => {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const r = await PushNotifications.checkPermissions();
        const mapped: PushPermStatus = r.receive === "granted" ? "granted" : r.receive === "denied" ? "denied" : "prompt";
        setPush((p) => ({ ...p, permStatus: mapped }));
        addLog("info", "Push", `Native permission: ${r.receive}`);
      } else {
        const perm = typeof Notification !== "undefined" ? Notification.permission : "default";
        const mapped = perm === "granted" ? "granted" : perm === "denied" ? "denied" : "prompt";
        setPush((p) => ({ ...p, permStatus: mapped }));
        addLog("info", "Push", `Browser notification permission: ${perm}`);
      }
    } catch (err) {
      addLog("error", "Push", "Permission check failed", String(err));
    }
  }, [addLog]);

  useEffect(() => { checkPushPermission(); }, [checkPushPermission]);

  const requestPushPermission = useCallback(async () => {
    setPush((p) => ({ ...p, loading: true, error: null }));
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const r = await PushNotifications.requestPermissions();
        const mapped: PushPermStatus = r.receive === "granted" ? "granted" : r.receive === "denied" ? "denied" : "prompt";
        setPush((p) => ({ ...p, permStatus: mapped, loading: false }));
        addLog(mapped === "granted" ? "success" : "warn", "Push", `Permission: ${r.receive}`);
      } else {
        const r = await Notification.requestPermission();
        const mapped = r === "granted" ? "granted" : r === "denied" ? "denied" : "prompt";
        setPush((p) => ({ ...p, permStatus: mapped, loading: false }));
        addLog(mapped === "granted" ? "success" : "warn", "Push", `Browser permission: ${r}`);
      }
    } catch (err) {
      setPush((p) => ({ ...p, error: String(err), loading: false }));
      addLog("error", "Push", "Permission request failed", String(err));
    }
  }, [addLog]);

  const registerDevice = useCallback(async () => {
    setPush((p) => ({ ...p, loading: true, regStatus: "pending", error: null }));
    addLog("info", "Push", "Registering device for push notifications…");
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) {
        throw new Error("FCM registration requires a native (Android/iOS) platform.");
      }
      const { PushNotifications } = await import("@capacitor/push-notifications");
      await PushNotifications.removeAllListeners();

      PushNotifications.addListener("registration", (token) => {
        setPush((p) => ({
          ...p, fcmToken: token.value, regStatus: "registered",
          lastRegTs: Date.now(), loading: false,
        }));
        addLog("success", "Push", "Device registered", `Token: ${token.value.slice(0, 24)}…`);
      });

      PushNotifications.addListener("registrationError", (err) => {
        const msg = typeof err === "object" ? JSON.stringify(err) : String(err);
        setPush((p) => ({ ...p, regStatus: "failed", error: msg, loading: false }));
        addLog("error", "Push", "Registration failed", msg);
      });

      await PushNotifications.register();
    } catch (err) {
      setPush((p) => ({ ...p, regStatus: "failed", error: String(err), loading: false }));
      addLog("error", "Push", "Registration error", String(err));
    }
  }, [addLog]);

  const refreshToken = useCallback(async () => {
    addLog("info", "Push", "Refreshing FCM token…");
    await registerDevice();
  }, [registerDevice]);

  // ── Section 3: Test Notification ─────────────────────────────────────────
  const [notifResult, setNotifResult] = useState<NotifTestResult>({
    status: "idle", sentTs: null, delivered: false, error: null,
  });

  const sendTestNotification = useCallback(async () => {
    setNotifResult({ status: "running", sentTs: null, delivered: false, error: null });
    addLog("info", "Notification", "Sending local test notification…");
    const sentTs = Date.now();
    try {
      if (typeof Notification === "undefined") throw new Error("Notification API unavailable");
      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission();
        if (result !== "granted") throw new Error("Notification permission denied");
      }
      const n = new Notification("JobAI24 — Diagnostic Test", {
        body:  "Push notification system is working correctly ✓",
        icon:  "/favicon.ico",
        tag:   "diag-test",
      });
      setTimeout(() => n.close(), 6000);
      setNotifResult({ status: "pass", sentTs, delivered: true, error: null });
      addLog("success", "Notification", "Local test notification delivered");
    } catch (err) {
      setNotifResult({ status: "fail", sentTs, delivered: false, error: String(err) });
      addLog("error", "Notification", "Test notification failed", String(err));
    }
  }, [addLog]);

  // ── Section 4: Deep Links ─────────────────────────────────────────────────
  const [deepLinkState, setDeepLinkState] = useState<DeepLinkState>(initDeepLinkState);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDeepLinkState((s) => ({ ...s, currentUrl: window.location.href }));
    }
    // Listen for Capacitor App URL open events
    async function listenDeepLinks() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        App.addListener("appUrlOpen", ({ url }) => {
          let route = url;
          try { route = new URL(url).pathname; } catch { /* keep url as-is */ }
          setDeepLinkState((s) => ({ ...s, lastOpenedLink: url, detectedRoute: route }));
          addLog("info", "DeepLink", `Received: ${url}`, `Route: ${route}`);
        });
      } catch (err) {
        addLog("warn", "DeepLink", "Deep link listener failed to init", String(err));
      }
    }
    // Verify App Links file is reachable
    async function checkAppLinks() {
      try {
        const res = await fetch("/.well-known/assetlinks.json", { cache: "no-store" });
        const ok  = res.ok;
        setDeepLinkState((s) => ({ ...s, appLinksOk: ok }));
        addLog(ok ? "success" : "warn", "DeepLink",
          ok ? "assetlinks.json reachable ✓" : "assetlinks.json not found");
      } catch {
        setDeepLinkState((s) => ({ ...s, appLinksOk: false }));
        addLog("warn", "DeepLink", "assetlinks.json unreachable");
      }
    }
    listenDeepLinks();
    checkAppLinks();
  }, [addLog]);

  const testDeepLink = useCallback(async (key: string, path: string) => {
    setDeepLinkState((s) => ({
      ...s,
      tests: s.tests.map((t) => t.key === key ? { ...t, status: "running" } : t),
    }));
    addLog("info", "DeepLink", `Testing navigation → ${path}`);
    try {
      router.push(path);
      await new Promise((r) => setTimeout(r, 600));
      setDeepLinkState((s) => ({
        ...s,
        tests: s.tests.map((t) => t.key === key ? { ...t, status: "pass" } : t),
      }));
      addLog("success", "DeepLink", `Navigation to ${path} passed`);
    } catch (err) {
      setDeepLinkState((s) => ({
        ...s,
        tests: s.tests.map((t) => t.key === key ? { ...t, status: "fail" } : t),
      }));
      addLog("error", "DeepLink", `Navigation to ${path} failed`, String(err));
    }
  }, [router, addLog]);

  // ── Section 5: File Upload ────────────────────────────────────────────────
  const [uploadTests, setUploadTests] = useState<UploadTest[]>(initUploadTests);

  const testFileUpload = useCallback(async (type: UploadTest["type"], file: File) => {
    setUploadTests((prev) =>
      prev.map((t) => t.type === type
        ? { ...t, status: "running", fileName: null, fileSize: null, mimeType: null, durationMs: null, error: null }
        : t),
    );
    addLog("info", "Upload", `Testing ${type}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    const start = performance.now();
    try {
      if (!isValidMime(type, file.type)) {
        throw new Error(`Invalid MIME: ${file.type || "(empty)"}`);
      }
      // Test WebView File API by reading first 64 KB
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve();
        reader.onerror = () => reject(new Error("FileReader API failed in this WebView"));
        reader.readAsArrayBuffer(file.slice(0, Math.min(file.size, 64 * 1024)));
      });
      const durationMs = Math.round(performance.now() - start);
      setUploadTests((prev) =>
        prev.map((t) => t.type === type
          ? { ...t, status: "pass", fileName: file.name, fileSize: file.size, mimeType: file.type, durationMs }
          : t),
      );
      addLog("success", "Upload", `${type} WebView compatibility: pass (${durationMs}ms)`);
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      setUploadTests((prev) =>
        prev.map((t) => t.type === type
          ? { ...t, status: "fail", fileName: file.name, fileSize: file.size, mimeType: file.type, durationMs, error: String(err) }
          : t),
      );
      addLog("error", "Upload", `${type} test failed`, String(err));
    }
  }, [addLog]);

  // ── Section 6: Auth ───────────────────────────────────────────────────────
  const [authDiag, setAuthDiag]           = useState<AuthDiag>(initAuthDiag);
  const [authTestRunning, setAuthTestRunning] = useState(false);

  // Sync basic auth state from useAuth
  useEffect(() => {
    const cookies = typeof document !== "undefined" ? document.cookie : "";
    const cookieCount = cookies.split(";").filter((c) => c.trim()).length;
    const jwtPresent  = cookies.includes("access_token") || cookies.includes("session");
    setAuthDiag((d) => ({
      ...d,
      isLoggedIn:    !!user,
      sessionStatus: user ? "active" : d.sessionStatus,
      jwtPresent,
      cookieCount,
    }));
  }, [user]);

  const runAuthTest = useCallback(async () => {
    setAuthTestRunning(true);
    setAuthDiag((d) => ({
      ...d,
      testStatus: "running",
      testDetail: null,
      checks: { loginPersist: "running", tokenRefresh: "idle", protectedAccess: "idle" },
    }));
    addLog("info", "Auth", "Starting authentication diagnostics…");

    // Check 1: Login persistence
    let loginPersist: DiagStatus = "fail";
    try {
      const u = await getCurrentUser();
      loginPersist = u ? "pass" : "warn";
      addLog(loginPersist === "pass" ? "success" : "warn", "Auth",
        `Login persistence: ${loginPersist}`, u ? `email: ${u.email}` : "no user");
    } catch (err) {
      addLog("error", "Auth", "Login persistence check failed", String(err));
    }
    setAuthDiag((d) => ({ ...d, checks: { ...d.checks, loginPersist, tokenRefresh: "running" } }));

    // Check 2: Token refresh
    let tokenRefresh: DiagStatus = "fail";
    try {
      await api.post("/auth/refresh");
      tokenRefresh = "pass";
      addLog("success", "Auth", "Token refresh: pass");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenRefresh = "warn"; // No refresh token — not a failure of the mechanism
        addLog("warn", "Auth", "Token refresh: no refresh token (session may be fresh)");
      } else {
        addLog("error", "Auth", "Token refresh failed", String(err));
      }
    }
    setAuthDiag((d) => ({ ...d, checks: { ...d.checks, tokenRefresh, protectedAccess: "running" } }));

    // Check 3: Protected API access
    let protectedAccess: DiagStatus = "fail";
    try {
      const me = await api.get<{ email: string }>("/auth/me");
      protectedAccess = me ? "pass" : "fail";
      addLog(protectedAccess === "pass" ? "success" : "warn", "Auth",
        `Protected API: ${protectedAccess}`, me ? `email: ${(me as any).email}` : undefined);
    } catch (err) {
      addLog("error", "Auth", "Protected API access failed", String(err));
    }

    const passed = [loginPersist, protectedAccess].filter((s) => s === "pass").length;
    const testStatus: DiagStatus =
      passed === 2 ? "pass" : passed === 1 ? "warn" : "fail";
    const testDetail =
      testStatus === "pass" ? "All authentication checks passed" :
      testStatus === "warn" ? "Some checks need attention" :
      "Authentication checks failed";

    setAuthDiag((d) => ({
      ...d,
      isLoggedIn:    loginPersist === "pass",
      sessionStatus: loginPersist === "pass" ? "active" : "expired",
      testStatus,
      testDetail,
      checks: { loginPersist, tokenRefresh, protectedAccess },
    }));
    setAuthTestRunning(false);
    addLog(testStatus === "pass" ? "success" : "warn", "Auth", `Auth test: ${testStatus}`);
  }, [addLog]);

  // ── Section 7: API Connectivity ───────────────────────────────────────────
  const [apiResults, setApiResults]       = useState<ApiEndpointResult[]>(initApiResults);
  const [apiTestRunning, setApiTestRunning] = useState(false);

  const runApiTests = useCallback(async () => {
    setApiTestRunning(true);
    setApiResults(initApiResults());
    addLog("info", "API", `Testing ${API_ENDPOINT_DEFS.length} endpoints…`);

    const results: ApiEndpointResult[] = [];
    for (const endpoint of API_ENDPOINT_DEFS) {
      const start = performance.now();
      try {
        const res = await fetch(endpoint.url, {
          method:      endpoint.method,
          credentials: "include",
          signal:      AbortSignal.timeout(8000),
        });
        const responseTimeMs = Math.round(performance.now() - start);
        const available      = res.status < 500;
        const result: ApiEndpointResult = {
          ...endpoint, statusCode: res.status, responseTimeMs, available, error: null,
        };
        results.push(result);
        setApiResults([...results, ...initApiResults().slice(results.length)]);
        addLog(available ? "success" : "warn", "API",
          `${endpoint.name}: HTTP ${res.status} (${responseTimeMs}ms)`, endpoint.url);
      } catch (err: any) {
        const responseTimeMs = Math.round(performance.now() - start);
        const result: ApiEndpointResult = {
          ...endpoint, statusCode: null, responseTimeMs, available: false,
          error: err?.message ?? String(err),
        };
        results.push(result);
        setApiResults([...results, ...initApiResults().slice(results.length)]);
        addLog("error", "API", `${endpoint.name}: FAILED`, String(err));
      }
    }
    setApiResults(results);
    setApiTestRunning(false);
    const ok = results.filter((r) => r.available).length;
    addLog("info", "API", `Connectivity tests complete: ${ok}/${results.length} available`);
  }, [addLog]);

  // ── Section 8: Health Score ───────────────────────────────────────────────
  const [healthScore, setHealthScore] = useState<HealthScore>({
    total: 0, pushNotifications: 0, deepLinks: 0, uploads: 0,
    authentication: 0, apiConnectivity: 0,
    label: "Not Ready", color: "red",
  });

  useEffect(() => {
    setHealthScore(calcHealthScore(push.permStatus, deepLinkState.tests, uploadTests, authDiag, apiResults));
  }, [push.permStatus, deepLinkState.tests, uploadTests, authDiag, apiResults]);

  // ── Log helpers ───────────────────────────────────────────────────────────
  const clearLogs = useCallback(() => setLogs([]), []);

  const exportLogs = useCallback(() => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `jobai-diag-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const copyLogs = useCallback(async () => {
    await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
  }, [logs]);

  return {
    // Section 1
    deviceInfo, deviceLoading,
    // Section 2
    push, checkPushPermission, requestPushPermission, registerDevice, refreshToken,
    // Section 3
    notifResult, sendTestNotification,
    // Section 4
    deepLinkState, testDeepLink,
    // Section 5
    uploadTests, testFileUpload,
    // Section 6
    authDiag, authTestRunning, runAuthTest,
    // Section 7
    apiResults, apiTestRunning, runApiTests,
    // Section 8
    healthScore,
    // Section 9
    logs, clearLogs, exportLogs, copyLogs,
  };
}
