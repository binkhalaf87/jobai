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

const BASE = "/admin";

export type AdminUserItem = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  balance_points: number | null;
};

export type AdminUsersResponse = {
  total: number;
  users: AdminUserItem[];
};

export type AdminStatsResponse = {
  total_users: number;
  active_users: number;
  jobseekers: number;
  recruiters: number;
  admins: number;
  total_resumes: number;
  total_interviews: number;
  total_sends: number;
};

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load stats"));
  return res.json();
}

export async function listAdminUsers(params: {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminUsersResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.role) qs.set("role", params.role);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("page_size", String(params.pageSize));
  const res = await fetch(`${getApiBaseUrl()}${BASE}/users?${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load users"));
  return res.json();
}

export async function patchAdminUser(
  id: string,
  data: { role?: string; is_active?: boolean },
): Promise<AdminUserItem> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/users/${id}`, {
    method: "PATCH",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to update user"));
  return res.json();
}

export async function adjustWallet(
  id: string,
  data: { points: number; reason: string },
): Promise<{ balance_points: number }> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/users/${id}/wallet`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to adjust wallet"));
  return res.json();
}

// ── Recipient Lists ────────────────────────────────────────────────────────────

export type AdminListItem = {
  id: string;
  name: string;
  description: string | null;
  total_count: number;
  created_at: string;
};

export type AdminContactItem = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  job_title: string | null;
};

export async function getLists(): Promise<AdminListItem[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/lists`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load lists"));
  return res.json();
}

export async function createList(data: { name: string; description?: string }): Promise<AdminListItem> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/lists`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to create list"));
  return res.json();
}

export async function deleteList(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/lists/${id}`, { method: "DELETE", headers: mutationHeaders() });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete list");
}

export async function getListContacts(id: string): Promise<AdminContactItem[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/lists/${id}/contacts`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load contacts");
  return res.json();
}

export async function addContact(listId: string, data: { email: string; full_name?: string; company_name?: string; job_title?: string }): Promise<AdminContactItem> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/lists/${listId}/contacts`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to add contact"));
  return res.json();
}

export async function bulkAddContacts(listId: string, emails: string[]): Promise<{ added: number }> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/lists/${listId}/contacts/bulk`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ emails }),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to bulk add"));
  return res.json();
}

export async function deleteContact(listId: string, contactId: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/lists/${listId}/contacts/${contactId}`, { method: "DELETE", headers: mutationHeaders() });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete contact");
}

// ── Gmail Connection Requests ──────────────────────────────────────────────────

export type AdminGmailRequestItem = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export async function listGmailRequests(status?: string): Promise<AdminGmailRequestItem[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await fetch(`${getApiBaseUrl()}${BASE}/gmail-requests${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load Gmail requests"));
  return res.json();
}

export async function approveGmailRequest(id: string): Promise<AdminGmailRequestItem> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/gmail-requests/${id}/approve`, {
    method: "POST",
    headers: mutationHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to approve request"));
  return res.json();
}

export async function rejectGmailRequest(id: string, reason?: string): Promise<AdminGmailRequestItem> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/gmail-requests/${id}/reject`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ reason: reason ?? null }),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to reject request"));
  return res.json();
}
