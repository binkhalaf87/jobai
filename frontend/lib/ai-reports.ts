import { api, fetchStream, getApiBaseUrl } from "@/lib/api";
import type { AIReportFull, AIReportListItem } from "@/types";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function listAIReports(reportType?: string): Promise<AIReportListItem[]> {
  const path = reportType
    ? `/analysis/ai-reports?report_type=${encodeURIComponent(reportType)}`
    : "/analysis/ai-reports";
  return api.get<AIReportListItem[]>(path);
}


export async function getAIReport(reportId: string): Promise<AIReportFull> {
  return api.get<AIReportFull>(`/analysis/ai-report/${reportId}`);
}


export async function updateAIReport(reportId: string, reportText: string): Promise<void> {
  await api.patch(`/analysis/ai-report/${reportId}`, { report_text: reportText });
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
  reportType: "analysis" | "enhancement" = "analysis",
  language: string = "English",
): Promise<void> {
  const csrf = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrf) headers["X-CSRF-Token"] = csrf;

  const res = await fetch(`${getApiBaseUrl()}/analysis/ai-report`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription || null, report_type: reportType, language }),
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
