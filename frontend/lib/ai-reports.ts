import { getApiBaseUrl, hasApiToken } from "@/lib/api";
import type { AIReportFull, AIReportListItem } from "@/types";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("jobai_access_token") ?? "";
}


export async function listAIReports(): Promise<AIReportListItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/analysis/ai-reports`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to load reports.");
  return res.json() as Promise<AIReportListItem[]>;
}


export async function getAIReport(reportId: string): Promise<AIReportFull> {
  const res = await fetch(`${getApiBaseUrl()}/analysis/ai-report/${reportId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to load report.");
  return res.json() as Promise<AIReportFull>;
}


export type SSEEvent =
  | { type: "id"; report_id: string }
  | { type: "chunk"; text: string }
  | { type: "done"; report_id: string }
  | { type: "error"; message: string };

/**
 * POST /analysis/ai-report and stream SSE events.
 * Calls onEvent for each parsed SSE message until done or error.
 */
export async function streamAIReport(
  resumeId: string,
  jobDescription: string,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/analysis/ai-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription || null }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(payload.detail ?? "Failed to start analysis.");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Streaming not supported in this environment.");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as SSEEvent;
        onEvent(event);
        if (event.type === "done" || event.type === "error") return;
      } catch {
        // ignore malformed SSE line
      }
    }
  }
}
