import { api, ApiError } from "@/lib/api";
import type { JobDescriptionPayload, JobDescriptionSubmitResponse } from "@/types";


export async function submitJobDescription(
  payload: JobDescriptionPayload
): Promise<JobDescriptionSubmitResponse> {
  try {
    return await api.post<JobDescriptionSubmitResponse>("/analysis/job-description", payload, {
      auth: true
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.detail);
    }

    throw new Error("Unable to save the job description.");
  }
}
