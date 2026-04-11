import { api } from "@/lib/api";
import type { JobResult, JobSearchResponse, SavedJob } from "@/types";

export type JobSearchParams = {
  q: string;
  location?: string;
  page?: number;
  date_posted?: "all" | "today" | "3days" | "week" | "month";
  employment_type?: string;
  resume_id?: string;
};

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const qs = new URLSearchParams();
  qs.set("q", params.q);
  if (params.location)        qs.set("location", params.location);
  if (params.page)            qs.set("page", String(params.page));
  if (params.date_posted)     qs.set("date_posted", params.date_posted);
  if (params.employment_type) qs.set("employment_type", params.employment_type);
  if (params.resume_id)       qs.set("resume_id", params.resume_id);

  return api.get<JobSearchResponse>(`/jobs/search?${qs.toString()}`, { auth: true });
}

export async function saveJob(job: JobResult): Promise<SavedJob> {
  return api.post<SavedJob>("/jobs/saved", job, { auth: true });
}

export async function unsaveJobByExternalId(jobId: string): Promise<void> {
  return api.delete<void>(`/jobs/saved/by-job-id/${encodeURIComponent(jobId)}`, undefined, { auth: true });
}

export async function getSavedJobs(): Promise<SavedJob[]> {
  return api.get<SavedJob[]>("/jobs/saved", { auth: true });
}

/** Store a job description in sessionStorage so the Analysis page can pre-fill it. */
export function prefillAnalysisWithJob(jobTitle: string, jobDescription: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("jobai_prefill_jd", jobDescription);
  sessionStorage.setItem("jobai_prefill_jd_title", jobTitle);
}
