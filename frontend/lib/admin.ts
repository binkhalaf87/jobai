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

export type AdminActivityItem = {
  event_type: string;
  user_name: string | null;
  user_email: string;
  detail: string | null;
  created_at: string;
};

export type AdminActivityResponse = {
  recent_activity: AdminActivityItem[];
  visitors_last_24h: number;
};

export async function getAdminActivity(): Promise<AdminActivityResponse> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/activity`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load activity"));
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

// ── Plans (admin read-only) ───────────────────────────────────────────────────

export type AdminPlanItem = {
  id: string;
  code: string;
  name: string;
  audience: string;
  kind: string;
  price_amount_minor: number | null;
  is_active: boolean;
};

export async function listAdminPlans(): Promise<AdminPlanItem[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/plans`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load plans"));
  return res.json();
}

// ── Promo Codes ────────────────────────────────────────────────────────────────

export type AdminPromoCodeItem = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  applicable_to: "all" | "jobseeker" | "recruiter";
  plan_id: string | null;
  plan_name: string | null;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPromoCodeCreate = {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  applicable_to?: "all" | "jobseeker" | "recruiter";
  plan_id?: string;
  max_uses?: number;
  max_uses_per_user?: number;
  valid_from?: string;
  valid_until?: string;
};

export type AdminPromoCodeUsageItem = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  payment_order_id: string | null;
  discount_applied_minor: number;
  created_at: string;
};

export async function listPromoCodes(isActive?: boolean): Promise<AdminPromoCodeItem[]> {
  const qs = isActive !== undefined ? `?is_active=${isActive}` : "";
  const res = await fetch(`${getApiBaseUrl()}${BASE}/promotions${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load promo codes"));
  return res.json();
}

export async function createPromoCode(data: AdminPromoCodeCreate): Promise<AdminPromoCodeItem> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/promotions`, {
    method: "POST",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to create promo code"));
  return res.json();
}

export async function patchPromoCode(
  id: string,
  data: { is_active?: boolean; description?: string; max_uses?: number; valid_until?: string },
): Promise<AdminPromoCodeItem> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/promotions/${id}`, {
    method: "PATCH",
    headers: mutationHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to update promo code"));
  return res.json();
}

export async function deletePromoCode(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/promotions/${id}`, {
    method: "DELETE",
    headers: mutationHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(await parseDetail(res, "Failed to delete promo code"));
}

export async function listPromoCodeUsages(id: string, page = 1): Promise<AdminPromoCodeUsageItem[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/promotions/${id}/usages?page=${page}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load usages"));
  return res.json();
}


// ── Analytics ─────────────────────────────────────────────────────────────────

export type AdminMonthlyRevenue = {
  month: string;        // "2026-01"
  revenue_sar: number;
  transactions: number;
};

export type AdminVisitorPoint = {
  label: string;        // "2026-05-28" or "2026-01"
  logins: number;
  signups: number;
};

export type AdminAnalyticsResponse = {
  monthly_revenue: AdminMonthlyRevenue[];
  visitor_trends: Record<string, AdminVisitorPoint[]>; // "7d" | "30d" | "12mo"
};

export async function getAdminAnalytics(): Promise<AdminAnalyticsResponse> {
  const res = await fetch(`${getApiBaseUrl()}${BASE}/analytics`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load analytics"));
  return res.json();
}


// ── User Profile ───────────────────────────────────────────────────────────────

export type AdminUserResumeItem = {
  id: string;
  title: string;
  source_filename: string | null;
  file_type: string | null;
  processing_status: string;
  page_count: number | null;
  created_at: string;
};

export type AdminUserActivityItem = {
  id: string;
  event_type: string;
  detail: string | null;
  credits_used: number;
  created_at: string;
};

export type AdminUserServiceSummaryItem = {
  event_type: string;
  count: number;
};

export type AdminUserProfileResponse = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  balance_points: number | null;
  activity: AdminUserActivityItem[];
  activity_total: number;
  resumes: AdminUserResumeItem[];
  services_summary: AdminUserServiceSummaryItem[];
};

export async function getAdminResumeFileUrl(
  userId: string,
  resumeId: string,
  inline = false,
): Promise<string> {
  const res = await fetch(
    `${getApiBaseUrl()}${BASE}/users/${userId}/resumes/${resumeId}/file${inline ? "?inline=true" : ""}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load file"));
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function getAdminUserProfile(
  userId: string,
  params: { activityPage?: number; activityPageSize?: number } = {},
): Promise<AdminUserProfileResponse> {
  const qs = new URLSearchParams();
  if (params.activityPage) qs.set("activity_page", String(params.activityPage));
  if (params.activityPageSize) qs.set("activity_page_size", String(params.activityPageSize));
  const query = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`${getApiBaseUrl()}${BASE}/users/${userId}/profile${query}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseDetail(res, "Failed to load user profile"));
  return res.json();
}
