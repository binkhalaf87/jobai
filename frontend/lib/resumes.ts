import { api, ApiError, getApiBaseUrl } from "@/lib/api";
import type { ResumeListItem, ResumeUploadResponse } from "@/types";


export async function uploadResume(file: File, onProgress?: (progress: number) => void): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    return await api.upload<ResumeUploadResponse>("/resume/upload", formData, {
      onProgress
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.detail);
    }

    throw new Error("Unable to upload the resume.");
  }
}


export async function listResumes(): Promise<ResumeListItem[]> {
  try {
    return await api.get<ResumeListItem[]>("/resume");
  } catch (error) {
    if (error instanceof ApiError) throw new Error(error.detail);
    throw new Error("Unable to load resumes.");
  }
}



export type ResumeFileResult = { blobUrl: string; filename: string };

export async function getResumeFile(resumeId: string, fallbackFilename: string): Promise<ResumeFileResult> {
  const baseUrl = getApiBaseUrl();

  // Use redirect:"manual" so credentials are not sent to the cloud storage redirect target (S3 CORS issue)
  const response = await fetch(`${baseUrl}/resume/${resumeId}/file`, {
    credentials: "include",
    redirect: "manual",
  });

  let finalResponse: Response;

  if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
    const redirectUrl = response.headers.get("location");
    if (!redirectUrl) throw new Error("Unable to load resume file.");
    finalResponse = await fetch(redirectUrl);
  } else {
    finalResponse = response;
  }

  if (!finalResponse.ok) {
    throw new Error("Unable to load resume file.");
  }

  // Extract filename from Content-Disposition if present
  const disposition = finalResponse.headers.get("content-disposition") ?? "";
  const match = /filename[^;=\n]*=(?:(["'])([^"'\n]*)\1|([^\s;]+))/.exec(disposition);
  const filename = match?.[2] ?? match?.[3] ?? fallbackFilename;

  const blob = await finalResponse.blob();
  return { blobUrl: URL.createObjectURL(blob), filename };
}


export async function deleteResume(resumeId: string): Promise<void> {
  try {
    await api.delete<void>(`/resume/${resumeId}`, undefined);
  } catch (error) {
    if (error instanceof ApiError) throw new Error(error.detail);
    throw new Error("Unable to delete resume.");
  }
}
