import { api } from "@/lib/api";
import type {
  AnswerEvaluation,
  ExperienceLevel,
  InterviewCompleteResponse,
  InterviewLanguage,
  InterviewListItem,
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
};

export type AnswerEvaluationResponse = {
  question_index: number;
  evaluation: AnswerEvaluation;
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

export async function listInterviews(): Promise<InterviewListItem[]> {
  return api.get<InterviewListItem[]>("/interviews/sessions", { auth: true });
}

export async function getInterview(sessionId: string): Promise<InterviewCompleteResponse> {
  return api.get<InterviewCompleteResponse>(`/interviews/sessions/${sessionId}`, { auth: true });
}
