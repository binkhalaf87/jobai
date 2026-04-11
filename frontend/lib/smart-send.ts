import { getApiBaseUrl } from "@/lib/api";
import type {
  Campaign,
  GenerateLettersResponse,
  RecipientIn,
  SmtpConnection,
} from "@/types";

const BASE_PATH = "/smart-send";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("jobai_access_token") ?? "";
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

async function parseDetail(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => ({})) as { detail?: string };
  return payload.detail || fallback;
}

// ── SMTP ──────────────────────────────────────────────────────────────────────

export async function getSmtpConnection(): Promise<SmtpConnection | null> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/smtp`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await parseDetail(res, "Failed to load SMTP connection"));
  }
  return res.json();
}

export async function saveSmtpConnection(data: {
  gmail_address: string;
  display_name: string;
  app_password: string;
}): Promise<SmtpConnection> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/smtp`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await parseDetail(res, "Failed to save SMTP connection"));
  }
  return res.json();
}

export async function verifySmtpConnection(): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/smtp/verify`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await parseDetail(res, "Verification failed"));
  }
}

export async function deleteSmtpConnection(): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/smtp`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove connection");
}

// ── Generate Letters ──────────────────────────────────────────────────────────

export async function generateLetters(data: {
  job_title: string;
  company_name?: string;
  job_description?: string;
  resume_id?: string;
}): Promise<GenerateLettersResponse> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/generate`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await parseDetail(res, "Failed to generate letters"));
  }
  return res.json();
}

// ── Confirm campaign ──────────────────────────────────────────────────────────

export async function confirmCampaign(
  campaign_id: string,
  data: {
    selected_variant: string;
    subject: string;
    body: string;
    recipients: RecipientIn[];
  }
): Promise<Campaign> {
  const res = await fetch(
    `${getApiBaseUrl()}${BASE_PATH}/campaigns/${campaign_id}/confirm`,
    {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ campaign_id, ...data }),
    }
  );
  if (!res.ok) {
    throw new Error(await parseDetail(res, "Failed to confirm campaign"));
  }
  return res.json();
}

// ── Campaign list / detail ────────────────────────────────────────────────────

export async function listCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/campaigns`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load campaigns");
  return res.json();
}

export async function getCampaign(id: string): Promise<Campaign> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/campaigns/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Campaign not found");
  return res.json();
}

// ── SSE send stream ───────────────────────────────────────────────────────────

export type SendProgressEvent =
  | { type: "start"; total: number; campaign_id: string }
  | { type: "progress"; index: number; total: number; email: string; status: "sent" | "failed"; error?: string }
  | { type: "done"; campaign_id: string; sent: number; failed: number; total: number }
  | { type: "error"; message: string };

export async function streamCampaignSend(
  campaign_id: string,
  onEvent: (event: SendProgressEvent) => void
): Promise<void> {
  const res = await fetch(
    `${getApiBaseUrl()}${BASE_PATH}/campaigns/${campaign_id}/send-stream`,
    { headers: authHeaders() }
  );

  if (!res.ok) {
    throw new Error(await parseDetail(res, "Failed to start send"));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Streaming not supported");

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        try {
          const payload = JSON.parse(line.slice(6));
          const event = { type: currentEvent, ...payload } as SendProgressEvent;
          onEvent(event);
          if (currentEvent === "done" || currentEvent === "error") return;
        } catch {
          // ignore malformed line
        }
        currentEvent = "";
      }
    }
  }
}
