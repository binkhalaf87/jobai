import { getApiBaseUrl } from "@/lib/api";
import type { GenerateLetterResponse, GmailStatus, SendHistoryItem } from "@/types";

const BASE = "/smart-send";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("jobai_access_token") ?? "";
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

async function parseDetail(res: Response, fallback: string): Promise<string> {
  const payload = await res.json().catch(() => ({})) as { detail?: string };
  return payload.detail || fallback;
}

// ── Gmail OAuth ───────────────────────────────────────────────────────────────

export async function getGmailAuthUrl(): Promise<string> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/gmail/auth`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to get auth URL"));
  const data = await res.json() as { auth_url: string };
  return data.auth_url;
}

export async function getGmailStatus(): Promise<GmailStatus> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/gmail/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load Gmail status"));
  return res.json();
}

export async function disconnectGmail(): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/gmail/disconnect`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to disconnect Gmail");
}

// ── Generate Letter ───────────────────────────────────────────────────────────

export async function generateLetter(data: {
  job_title: string;
  company_name?: string;
  job_description?: string;
  resume_id?: string;
}): Promise<GenerateLetterResponse> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/generate`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to generate letter"));
  return res.json();
}

// ── Send ──────────────────────────────────────────────────────────────────────

export async function sendEmail(data: {
  job_title: string;
  company_name?: string;
  subject: string;
  body: string;
  recipient_email: string;
  recipient_name?: string;
  resume_id?: string;
}): Promise<{ id: string; status: string; recipient_email: string; sent_at: string | null }> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/send`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to send email"));
  return res.json();
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<SendHistoryItem[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/history`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}
