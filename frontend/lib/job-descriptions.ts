import { api, ApiError } from "@/lib/api";
import type { JobDescriptionListItem, JobDescriptionPayload, JobDescriptionSubmitResponse } from "@/types";

export async function listJobDescriptions(): Promise<JobDescriptionListItem[]> {
  return api.get<JobDescriptionListItem[]>("/analysis/job-descriptions");
}


export async function submitJobDescription(
  payload: JobDescriptionPayload
): Promise<JobDescriptionSubmitResponse> {
  try {
    return await api.post<JobDescriptionSubmitResponse>("/analysis/job-description", payload, {
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.detail);
    }

    throw new Error("Unable to save the job description.");
  }
}
