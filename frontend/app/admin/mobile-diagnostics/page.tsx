"use client";

import { useRef, useState } from "react";
import {
  Smartphone, Wifi, WifiOff, Bell, BellOff, Link2, Upload, ShieldCheck,
  Globe, Activity, ClipboardList, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Copy, Download, Trash2, RefreshCw, Send, Camera,
  FileText, Image as ImageIcon, ChevronRight, Monitor,
} from "lucide-react";

import { useMobileDiagnostics } from "@/hooks/use-mobile-diagnostics";
import { type DiagStatus, type LogLevel, formatBytes, formatTs } from "@/lib/mobile-diagnostics";

// ─── Shared UI primitives ──────────────────────────────────────────────────────

function StatusPill({ status }: { status: DiagStatus | LogLevel | "online" | "offline" | null }) {
  const map: Record<string, string> = {
    pass:       "bg-emerald-100 text-emerald-700",
    success:    "bg-emerald-100 text-emerald-700",
    online:     "bg-emerald-100 text-emerald-700",
    granted:    "bg-emerald-100 text-emerald-700",
    registered: "bg-emerald-100 text-emerald-700",
    active:     "bg-emerald-100 text-emerald-700",

    warn:    "bg-amber-100 text-amber-700",
    warning: "bg-amber-100 text-amber-700",
    prompt:  "bg-amber-100 text-amber-700",
    pending: "bg-amber-100 text-amber-700",

    fail:         "bg-rose-100 text-rose-700",
    error:        "bg-rose-100 text-rose-700",
    offline:      "bg-rose-100 text-rose-700",
    denied:       "bg-rose-100 text-rose-700",
    failed:       "bg-rose-100 text-rose-700",
    unregistered: "bg-rose-100 text-rose-700",

    running: "bg-sky-100 text-sky-700",
    info:    "bg-slate-100 text-slate-600",
    idle:    "bg-slate-100 text-slate-500",
    unknown: "bg-slate-100 text-slate-500",
    expired: "bg-slate-100 text-slate-500",
  };
  const label = status ?? "idle";
  const cls   = map[label] ?? "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize ${cls}`}>
      {label === "running" && <Loader2 size={9} className="animate-spin" />}
      {label}
    </span>
  );
}

function StatusIcon({ status }: { status: DiagStatus }) {
  if (status === "pass")    return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === "fail")    return <XCircle      size={14} className="text-rose-500" />;
  if (status === "warn")    return <AlertTriangle size={14} className="text-amber-500" />;
  if (status === "running") return <Loader2      size={14} className="text-sky-500 animate-spin" />;
  return <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200" />;
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon size={15} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-slate-900">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
      <span className="text-[12px] font-medium text-slate-500 shrink-0">{label}</span>
      <span className={`text-[12px] font-semibold text-slate-800 text-right truncate ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ActionBtn({
  onClick, loading = false, disabled = false, variant = "primary", children,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}) {
  const cls = {
    primary:   "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger:    "bg-rose-50 text-rose-600 hover:bg-rose-100",
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-50 ${cls}`}
    >
      {loading && <Loader2 size={11} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MobileDiagnosticsPage() {
  const {
    deviceInfo, deviceLoading,
    push, checkPushPermission, requestPushPermission, registerDevice, refreshToken,
    notifResult, sendTestNotification,
    deepLinkState, testDeepLink,
    uploadTests, testFileUpload,
    authDiag, authTestRunning, runAuthTest,
    apiResults, apiTestRunning, runApiTests,
    healthScore,
    logs, clearLogs, exportLogs, copyLogs,
  } = useMobileDiagnostics();

  // File input refs per upload type
  const fileInputRefs = {
    pdf:    useRef<HTMLInputElement>(null),
    docx:   useRef<HTMLInputElement>(null),
    image:  useRef<HTMLInputElement>(null),
    camera: useRef<HTMLInputElement>(null),
  } as const;

  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLogs,  setCopiedLogs]  = useState(false);

  async function handleCopyToken() {
    if (!push.fcmToken) return;
    await navigator.clipboard.writeText(push.fcmToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  async function handleCopyLogs() {
    await copyLogs();
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  }

  function handleFileChange(type: "pdf" | "docx" | "image" | "camera", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) testFileUpload(type, file);
    e.target.value = "";
  }

  const scoreColor = {
    green:  "text-emerald-600",
    yellow: "text-amber-500",
    red:    "text-rose-500",
  }[healthScore.color];

  const scoreBg = {
    green:  "border-emerald-200 bg-emerald-50",
    yellow: "border-amber-200 bg-amber-50",
    red:    "border-rose-200 bg-rose-50",
  }[healthScore.color];

  return (
    <div className="mx-auto max-w-4xl space-y-5">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mobile Diagnostics</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Validate all mobile functionality before publishing to Google Play and App Store.
          </p>
        </div>
        <span className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold ${scoreBg} ${scoreColor}`}>
          Score: {healthScore.total}/100
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Device Information
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={Smartphone} title="Device Information" subtitle="Platform and hardware details">
        {deviceLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" /> Loading device info…
          </div>
        ) : deviceInfo ? (
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-10">
            <div>
              <InfoRow label="Platform"     value={<StatusPill status={deviceInfo.platform as DiagStatus} />} />
              <InfoRow label="Model"        value={deviceInfo.model} />
              <InfoRow label="Manufacturer" value={deviceInfo.manufacturer} />
              <InfoRow label="OS Version"   value={deviceInfo.osVersion} />
              <InfoRow label="App Version"  value={deviceInfo.appVersion} />
            </div>
            <div>
              <InfoRow label="Capacitor"   value={deviceInfo.capacitorVersion} />
              <InfoRow label="Screen"      value={`${deviceInfo.screenWidth}×${deviceInfo.screenHeight}`} />
              <InfoRow label="Network"     value={<StatusPill status={deviceInfo.isOnline ? "online" : "offline"} />} />
              <InfoRow label="WebView"     value={deviceInfo.isNative ? "Native" : "Browser"} />
              <InfoRow label="User Agent"  value={
                <span className="max-w-[220px] truncate text-[10px] font-mono text-slate-500" title={deviceInfo.userAgent}>
                  {deviceInfo.userAgent}
                </span>
              } />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No device info available.</p>
        )}
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Push Notifications
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={Bell} title="Firebase & Push Notifications" subtitle="FCM token and permission status">
        <div className="space-y-4">
          {/* Permission + Registration status */}
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-10">
            <div>
              <InfoRow label="Permission"   value={<StatusPill status={push.permStatus as DiagStatus} />} />
              <InfoRow label="Registration" value={<StatusPill status={push.regStatus as DiagStatus} />} />
              <InfoRow label="Last Reg."    value={push.lastRegTs ? formatTs(push.lastRegTs) : "—"} />
            </div>
            <div>
              <InfoRow label="FCM Token" value={
                push.fcmToken
                  ? <span className="font-mono text-[10px] text-slate-500">{push.fcmToken.slice(0, 28)}…</span>
                  : <span className="text-slate-400">Not registered</span>
              } />
              {push.error && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-600">{push.error}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <ActionBtn onClick={requestPushPermission} loading={push.loading} variant="primary">
              <Bell size={11} /> Request Permission
            </ActionBtn>
            <ActionBtn onClick={registerDevice} loading={push.loading} variant="secondary">
              <Smartphone size={11} /> Register Device
            </ActionBtn>
            <ActionBtn onClick={refreshToken} loading={push.loading} variant="secondary">
              <RefreshCw size={11} /> Refresh Token
            </ActionBtn>
            {push.fcmToken && (
              <ActionBtn onClick={handleCopyToken} variant="secondary">
                <Copy size={11} /> {copiedToken ? "Copied!" : "Copy Token"}
              </ActionBtn>
            )}
            <ActionBtn onClick={checkPushPermission} variant="secondary">
              <Activity size={11} /> Check Status
            </ActionBtn>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Test Push Notification
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={Send} title="Test Push Notification" subtitle="Trigger a local notification to verify delivery">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <InfoRow label="Status"    value={<StatusPill status={notifResult.status} />} />
            <InfoRow label="Sent at"   value={notifResult.sentTs ? formatTs(notifResult.sentTs) : "—"} />
            <InfoRow label="Delivered" value={notifResult.delivered ? "Yes" : "—"} />
            {notifResult.error && (
              <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] text-rose-600">{notifResult.error}</p>
            )}
          </div>
          <ActionBtn
            onClick={sendTestNotification}
            loading={notifResult.status === "running"}
            variant="primary"
          >
            <Send size={11} /> Send Local Test Notification
          </ActionBtn>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Deep Link Testing
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={Link2} title="Deep Link Testing" subtitle="App Links, Universal Links, and navigation">
        <div className="space-y-4">
          <div>
            <InfoRow label="Current URL"   value={<span className="font-mono text-[10px] text-slate-500 truncate max-w-[220px]">{deepLinkState.currentUrl}</span>} />
            <InfoRow label="Last Deep Link" value={deepLinkState.lastOpenedLink ?? "—"} />
            <InfoRow label="Detected Route" value={deepLinkState.detectedRoute ?? "—"} />
            <InfoRow label="App Links File" value={
              deepLinkState.appLinksOk === null ? "—" :
              <StatusPill status={deepLinkState.appLinksOk ? "pass" : "fail"} />
            } />
          </div>

          {/* Navigation tests */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Tests
            </div>
            <div className="divide-y divide-slate-100">
              {deepLinkState.tests.map((test) => (
                <div key={test.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={test.status} />
                    <span className="text-[12px] font-medium text-slate-700">{test.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">{test.path}</span>
                  </div>
                  <ActionBtn
                    onClick={() => testDeepLink(test.key, test.path)}
                    loading={test.status === "running"}
                    variant="secondary"
                  >
                    <ChevronRight size={11} /> Test
                  </ActionBtn>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — File Upload Test
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={Upload} title="File Upload Compatibility" subtitle="WebView File API and MIME type validation">
        {/* Hidden file inputs */}
        <input ref={fileInputRefs.pdf}    type="file" accept="application/pdf" className="hidden"
          onChange={(e) => handleFileChange("pdf", e)} />
        <input ref={fileInputRefs.docx}   type="file"
          accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          className="hidden" onChange={(e) => handleFileChange("docx", e)} />
        <input ref={fileInputRefs.image}  type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={(e) => handleFileChange("image", e)} />
        <input ref={fileInputRefs.camera} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={(e) => handleFileChange("camera", e)} />

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5">Type</th>
                <th className="hidden sm:table-cell px-4 py-2.5">File</th>
                <th className="hidden sm:table-cell px-4 py-2.5">Size</th>
                <th className="hidden sm:table-cell px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploadTests.map((test) => {
                const Icon = test.type === "pdf"
                  ? FileText
                  : test.type === "camera"
                  ? Camera
                  : ImageIcon;
                return (
                  <tr key={test.type} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Icon size={13} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{test.label}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2.5 text-slate-500 max-w-[140px]">
                      <span className="truncate block">{test.fileName ?? "—"}</span>
                      {test.mimeType && <span className="text-[10px] text-slate-400">{test.mimeType}</span>}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2.5 text-slate-500">
                      {test.fileSize ? formatBytes(test.fileSize) : "—"}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2.5 text-slate-500">
                      {test.durationMs != null ? `${test.durationMs}ms` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {test.error
                        ? <span className="text-rose-600 text-[11px]" title={test.error}><StatusPill status="fail" /></span>
                        : <StatusPill status={test.status} />
                      }
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ActionBtn
                        onClick={() => fileInputRefs[test.type].current?.click()}
                        loading={test.status === "running"}
                        variant="secondary"
                      >
                        <Upload size={11} /> Pick File
                      </ActionBtn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Tests WebView File API compatibility. Files are read client-side only — no data is sent to the server.
        </p>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — Authentication Test
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={ShieldCheck} title="Authentication Test" subtitle="Session, JWT, and protected API access">
        <div className="space-y-4">
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-10">
            <div>
              <InfoRow label="Logged In"     value={<StatusPill status={authDiag.isLoggedIn ? "pass" : "fail"} />} />
              <InfoRow label="Session"       value={<StatusPill status={authDiag.sessionStatus as DiagStatus} />} />
              <InfoRow label="JWT Present"   value={<StatusPill status={authDiag.jwtPresent ? "pass" : "warn"} />} />
              <InfoRow label="Cookies"       value={`${authDiag.cookieCount} found`} />
            </div>
            <div>
              <InfoRow label="Login Persist"    value={<StatusPill status={authDiag.checks.loginPersist} />} />
              <InfoRow label="Token Refresh"    value={<StatusPill status={authDiag.checks.tokenRefresh} />} />
              <InfoRow label="Protected Access" value={<StatusPill status={authDiag.checks.protectedAccess} />} />
              <InfoRow label="Overall"          value={<StatusPill status={authDiag.testStatus} />} />
            </div>
          </div>
          {authDiag.testDetail && (
            <p className={`rounded-lg px-3 py-2 text-[12px] font-medium ${
              authDiag.testStatus === "pass" ? "bg-emerald-50 text-emerald-700"
              : authDiag.testStatus === "warn" ? "bg-amber-50 text-amber-700"
              : "bg-rose-50 text-rose-700"
            }`}>
              {authDiag.testDetail}
            </p>
          )}
          <ActionBtn onClick={runAuthTest} loading={authTestRunning} variant="primary">
            <ShieldCheck size={11} /> Run Authentication Test
          </ActionBtn>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — API Connectivity
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={Globe} title="API Connectivity" subtitle="Response time, status codes, and availability">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2.5">Endpoint</th>
                  <th className="hidden sm:table-cell px-4 py-2.5">URL</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiResults.map((r) => (
                  <tr key={r.name} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{r.name}</td>
                    <td className="hidden sm:table-cell px-4 py-2.5 font-mono text-[10px] text-slate-400">{r.url}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {r.statusCode != null ? (
                        <span className={r.statusCode < 400 ? "text-emerald-600 font-bold"
                          : r.statusCode < 500 ? "text-amber-600 font-bold"
                          : "text-rose-600 font-bold"}>
                          {r.statusCode}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {r.responseTimeMs != null ? `${r.responseTimeMs}ms` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.error
                        ? <span title={r.error}><StatusPill status="fail" /></span>
                        : r.statusCode != null
                        ? <StatusPill status={r.available ? "pass" : "fail"} />
                        : <StatusPill status="idle" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ActionBtn onClick={runApiTests} loading={apiTestRunning} variant="primary">
            <Activity size={11} /> Run Connectivity Tests
          </ActionBtn>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8 — App Health Score
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={Monitor} title="App Health Score" subtitle="Mobile readiness assessment">
        <div className="space-y-4">
          {/* Big score */}
          <div className={`flex items-center justify-between rounded-xl border p-4 ${scoreBg}`}>
            <div>
              <p className={`text-4xl font-black ${scoreColor}`}>{healthScore.total}<span className="text-xl font-semibold text-slate-400">/100</span></p>
              <p className={`mt-1 text-sm font-bold ${scoreColor}`}>{healthScore.label}</p>
            </div>
            <div className="text-right space-y-1">
              {(["pushNotifications", "deepLinks", "uploads", "authentication", "apiConnectivity"] as const).map((k) => {
                const labels: Record<string, string> = {
                  pushNotifications: "Push Notifications",
                  deepLinks:         "Deep Links",
                  uploads:           "Uploads",
                  authentication:    "Authentication",
                  apiConnectivity:   "API Connectivity",
                };
                const score = healthScore[k];
                return (
                  <div key={k} className="flex items-center gap-3 justify-end">
                    <span className="text-[11px] text-slate-500">{labels[k]}</span>
                    <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${score >= 16 ? "bg-emerald-500" : score >= 10 ? "bg-amber-500" : "bg-rose-400"}`}
                        style={{ width: `${(score / 20) * 100}%` }}
                      />
                    </div>
                    <span className={`w-8 text-[11px] font-bold text-right ${score >= 16 ? "text-emerald-600" : score >= 10 ? "text-amber-600" : "text-rose-500"}`}>
                      {score}/20
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {healthScore.total < 90 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Recommendations</p>
              {healthScore.pushNotifications < 20 && (
                <p className="text-[12px] text-amber-700">• Grant push notification permission and register the device for FCM.</p>
              )}
              {healthScore.deepLinks < 20 && (
                <p className="text-[12px] text-amber-700">• Run all deep link navigation tests and update assetlinks.json with your keystore SHA256.</p>
              )}
              {healthScore.uploads < 20 && (
                <p className="text-[12px] text-amber-700">• Test all file upload types (PDF, DOCX, Image, Camera) to verify WebView File API compatibility.</p>
              )}
              {healthScore.authentication < 20 && (
                <p className="text-[12px] text-amber-700">• Run the authentication test while logged in to verify session, token refresh, and API access.</p>
              )}
              {healthScore.apiConnectivity < 20 && (
                <p className="text-[12px] text-amber-700">• Run API connectivity tests — ensure backend endpoints respond with HTTP &lt; 500.</p>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 9 — Debug Logs
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={ClipboardList} title="Debug Logs" subtitle="Live diagnostics console">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <ActionBtn onClick={handleCopyLogs} variant="secondary">
              <Copy size={11} /> {copiedLogs ? "Copied!" : "Copy Logs"}
            </ActionBtn>
            <ActionBtn onClick={exportLogs} variant="secondary">
              <Download size={11} /> Export JSON
            </ActionBtn>
            <ActionBtn onClick={clearLogs} variant="danger">
              <Trash2 size={11} /> Clear Logs
            </ActionBtn>
          </div>

          <div className="h-80 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] leading-5">
            {logs.length === 0 ? (
              <p className="text-slate-500">No log entries yet. Run diagnostics to populate the console.</p>
            ) : (
              [...logs].reverse().map((log) => {
                const levelCls: Record<LogLevel, string> = {
                  info:    "text-sky-400",
                  success: "text-emerald-400",
                  warn:    "text-amber-400",
                  error:   "text-rose-400",
                };
                return (
                  <div key={log.id} className="flex gap-2 py-0.5">
                    <span className="shrink-0 text-slate-500">{formatTs(log.ts)}</span>
                    <span className={`shrink-0 w-16 font-bold ${levelCls[log.level]}`}>[{log.section}]</span>
                    <span className="text-slate-300">{log.message}</span>
                    {log.detail && <span className="text-slate-500 truncate">{log.detail}</span>}
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {logs.length} log entries · Newest entries shown first
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
