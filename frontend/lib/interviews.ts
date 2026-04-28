import { api, fetchStream } from "@/lib/api";
import type {
  AnswerEvaluation,
  ExperienceLevel,
  InterviewCompleteResponse,
  InterviewerStyle,
  InterviewLanguage,
  InterviewListItem,
  InterviewQuestion,
  InterviewSessionResponse,
  InterviewType,
  QuestionCount,
} from "@/types";

export type StartInterviewPayload = {
  job_title: string;
  experience_level: ExperienceLevel;
  interview_type: InterviewType;
  language: InterviewLanguage;
  question_count: QuestionCount;
  resume_id?: string;
  company_name?: string;
  job_description?: string;
  interviewer_style: InterviewerStyle;
};

export type AnswerEvaluationResponse = {
  question_index: number;
  evaluation: AnswerEvaluation;
  questions: InterviewQuestion[];
  next_question: InterviewQuestion | null;
};

export async function startInterview(payload: StartInterviewPayload): Promise<InterviewSessionResponse> {
  return api.post<InterviewSessionResponse>("/interviews/sessions", payload, { auth: true });
}

export async function submitAnswer(
  sessionId: string,
  questionIndex: number,
  question: string,
  answer: string,
): Promise<AnswerEvaluationResponse> {
  return api.post<AnswerEvaluationResponse>(
    `/interviews/sessions/${sessionId}/answer`,
    { question_index: questionIndex, question, answer },
    { auth: true },
  );
}

export async function completeInterview(sessionId: string): Promise<InterviewCompleteResponse> {
  return api.post<InterviewCompleteResponse>(
    `/interviews/sessions/${sessionId}/complete`,
    undefined,
    { auth: true },
  );
}

export type StreamEvalEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; payload: AnswerEvaluationResponse }
  | { type: "error"; detail: string };

function unescapeJson(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

export function extractStreamingReply(partial: string): string {
  const complete = partial.match(/"interviewer_reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (complete) return unescapeJson(complete[1]);
  const inProgress = partial.match(/"interviewer_reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (inProgress) return unescapeJson(inProgress[1]);
  return "";
}

export async function* submitAnswerStream(
  sessionId: string,
  questionIndex: number,
  question: string,
  answer: string,
): AsyncGenerator<StreamEvalEvent, void, unknown> {
  const response = await fetchStream(`/interviews/sessions/${sessionId}/answer/stream`, {
    method: "POST",
    auth: true,
    body: { question_index: questionIndex, question, answer },
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6)) as { type: string; text?: string; payload?: unknown; detail?: string };
          if (event.type === "chunk" && event.text) {
            yield { type: "chunk", text: event.text };
          } else if (event.type === "done" && event.payload) {
            yield { type: "done", payload: event.payload as AnswerEvaluationResponse };
          } else if (event.type === "error") {
            yield { type: "error", detail: event.detail ?? "Evaluation failed." };
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function listInterviews(): Promise<InterviewListItem[]> {
  return api.get<InterviewListItem[]>("/interviews/sessions", { auth: true });
}

export async function getInterview(sessionId: string): Promise<InterviewCompleteResponse> {
  return api.get<InterviewCompleteResponse>(`/interviews/sessions/${sessionId}`, { auth: true });
}
