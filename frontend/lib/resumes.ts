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

  // Get the download URL from the backend (avoids CORS issues with cloud storage redirects)
  const urlData = await api.get<{ url: string | null; filename: string }>(`/resume/${resumeId}/file-url`);
  const filename = urlData.filename || fallbackFilename;

  if (urlData.url) {
    // Cloud: fetch the pre-signed URL directly without credentials (S3 CORS requirement)
    const response = await fetch(urlData.url);
    if (!response.ok) throw new Error("Unable to load resume file.");
    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), filename };
  }

  // Local: stream through the backend with credentials
  const response = await fetch(`${baseUrl}/resume/${resumeId}/file`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to load resume file.");
  const blob = await response.blob();
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
