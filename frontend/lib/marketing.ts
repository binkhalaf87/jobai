import { getApiBaseUrl } from "@/lib/api";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("jobai_access_token") ?? "";
}

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

function mutationHeaders(extra?: Record<string, string>): Record<string, string> {
  const csrf = getCsrfToken();
  return authHeaders({ ...(csrf ? { "X-CSRF-Token": csrf } : {}), ...extra });
}

async function parseDetail(res: Response, fallback: string): Promise<string> {
  const payload = await res.json().catch(() => ({})) as { detail?: string };
  return payload.detail || fallback;
}

const BASE = "/admin/marketing";

export type MarketingCampaign = {
  id: string;
  name: string;
  subject: string;
  from_name: string;
  from_email: string;
  html_body: string;
  status: "draft" | "active" | "paused" | "completed" | "error";
  warmup_start_date: string | null;
  current_daily_limit: number;
  total_contacts: number;
  total_sent: number;
  total_failed: number;
  last_sent_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  progress_pct: number;
};

export type WarmupScheduleEntry = {
  min_day: number;
  max_day: number | null;
  daily_limit: number;
};

export async function getCampaigns(): Promise<MarketingCampaign[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load campaigns"));
  return res.json();
}

export async function getCampaign(id: string): Promise<MarketingCampaign> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Campaign not found"));
  return res.json();
}

export async function createCampaign(data: {
  name: string;
  subject: string;
  html_body: string;
  from_name?: string;
  from_email?: string;
}): Promise<MarketingCampaign> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to create campaign"));
  return res.json();
}

export async function importContacts(
  campaignId: string,
  file: File,
): Promise<{ added: number; skipped: number }> {
  const form = new FormData();
  form.append("file", file);
  const csrf = getCsrfToken();
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns/${campaignId}/import`, {
    method: "POST",
    headers: authHeaders(csrf ? { "X-CSRF-Token": csrf } : {}),
    body: form,
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Import failed"));
  return res.json();
}

export async function activateCampaign(id: string): Promise<MarketingCampaign> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns/${id}/activate`, {
    method: "PATCH",
    headers: mutationHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to activate"));
  return res.json();
}

export async function pauseCampaign(id: string): Promise<MarketingCampaign> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns/${id}/pause`, {
    method: "PATCH",
    headers: mutationHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to pause"));
  return res.json();
}

export async function resumeCampaign(id: string): Promise<MarketingCampaign> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns/${id}/resume`, {
    method: "PATCH",
    headers: mutationHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to resume"));
  return res.json();
}

export async function retryCampaign(id: string): Promise<MarketingCampaign> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns/${id}/retry`, {
    method: "PATCH",
    headers: mutationHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to retry campaign"));
  return res.json();
}

export async function deleteCampaign(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/campaigns/${id}`, {
    method: "DELETE",
    headers: mutationHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to delete campaign"));
}

export async function getWarmupSchedule(): Promise<WarmupScheduleEntry[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/warmup-schedule`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load schedule");
  return res.json();
}

export function downloadTemplate(): void {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("jobai_access_token") ?? "" : "";
  const url = `${getApiBaseUrl()}${BASE}/campaigns/template/download`;
  const a = document.createElement("a");
  a.href = url;
  a.download = "marketing_contacts_template.xlsx";
  // Fetch with auth and trigger blob download
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    })
    .catch(() => {});
}

// ── Brevo Analytics ────────────────────────────────────────────────────────────

export type BrevoEmailCampaign = {
  id: number;
  name: string;
  subject: string;
  sent_date: string | null;
  delivered: number;
  unique_opens: number;
  unique_clicks: number;
  unsubscriptions: number;
  open_rate: number;
};

export async function getBrevoEmailCampaigns(): Promise<BrevoEmailCampaign[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/brevo/campaigns`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load Brevo campaigns"));
  return res.json();
}

export async function getBrevoOpeners(campaignId: number): Promise<{ campaign_id: number; count: number }> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/brevo/campaigns/${campaignId}/openers`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to fetch openers"));
  return res.json();
}

export async function saveOpenersToList(
  campaignId: number,
  listName: string,
  includeClickers: boolean,
): Promise<{ list_id: string; list_name: string; added: number }> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/brevo/campaigns/${campaignId}/save-openers`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ list_name: listName, include_clickers: includeClickers }),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to save openers"));
  return res.json();
}
