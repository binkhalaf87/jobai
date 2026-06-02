import { api } from "@/lib/api";
import type { GenerateLetterResponse, GmailConnectionRequest, GmailStatus, SendHistoryItem } from "@/types";

const BASE = "/smart-send";

// ── Gmail Connection Request ──────────────────────────────────────────────────

export async function requestGmailAccess(requestedGmail?: string): Promise<GmailConnectionRequest> {
  return api.post<GmailConnectionRequest>(`${BASE}/gmail/request`, {
    requested_gmail: requestedGmail ?? null,
  });
}

export async function getGmailRequestStatus(): Promise<GmailConnectionRequest | null> {
  try {
    return await api.get<GmailConnectionRequest | null>(`${BASE}/gmail/request/status`);
  } catch {
    return null;
  }
}

// ── Gmail OAuth ───────────────────────────────────────────────────────────────

export async function getGmailAuthUrl(): Promise<string> {
  const data = await api.get<{ auth_url: string }>(`${BASE}/gmail/auth`);
  return data.auth_url;
}

export async function getGmailStatus(): Promise<GmailStatus> {
  return api.get<GmailStatus>(`${BASE}/gmail/status`);
}

export async function disconnectGmail(): Promise<void> {
  return api.delete<void>(`${BASE}/gmail/disconnect`);
}

export async function testGmailSend(): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(`${BASE}/gmail/test-send`);
}

// ── Generate Letter ───────────────────────────────────────────────────────────

export async function generateLetter(data: {
  job_title: string;
  company_name?: string;
  job_description?: string;
  resume_id?: string;
}): Promise<GenerateLetterResponse> {
  return api.post<GenerateLetterResponse>(`${BASE}/generate`, data);
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
  return api.post(`${BASE}/send`, data);
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<SendHistoryItem[]> {
  return api.get<SendHistoryItem[]>(`${BASE}/history`);
}

// ── Recipient Lists ───────────────────────────────────────────────────────────

export async function getRecipientLists(): Promise<import("@/types").RecipientList[]> {
  return api.get<import("@/types").RecipientList[]>(`${BASE}/recipient-lists`);
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export async function createCampaign(data: {
  list_id: string;
  subject: string;
  body: string;
  resume_id?: string;
  daily_limit?: number;
}): Promise<import("@/types").Campaign> {
  return api.post<import("@/types").Campaign>(`${BASE}/campaigns`, data);
}

export async function getCampaigns(): Promise<import("@/types").Campaign[]> {
  return api.get<import("@/types").Campaign[]>(`${BASE}/campaigns`);
}

export async function pauseCampaign(id: string): Promise<import("@/types").Campaign> {
  return api.patch<import("@/types").Campaign>(`${BASE}/campaigns/${id}/pause`);
}

export async function resumeCampaign(id: string): Promise<import("@/types").Campaign> {
  return api.patch<import("@/types").Campaign>(`${BASE}/campaigns/${id}/resume`);
}
