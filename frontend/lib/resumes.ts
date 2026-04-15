import { api, ApiError, getApiBaseUrl } from "@/lib/api";
import type { ResumeListItem, ResumeUploadResponse } from "@/types";


export async function uploadResume(file: File, onProgress?: (progress: number) => void): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    return await api.upload<ResumeUploadResponse>("/resume/upload", formData, {
      auth: true,
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
    return await api.get<ResumeListItem[]>("/resume/", { auth: true });
  } catch (error) {
    if (error instanceof ApiError) throw new Error(error.detail);
    throw new Error("Unable to load resumes.");
  }
}



export type ResumeFileResult = { blobUrl: string; filename: string };

export async function getResumeFile(resumeId: string, fallbackFilename: string): Promise<ResumeFileResult> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("jobai_access_token") : null;
  const baseUrl = getApiBaseUrl();

  // fetch with redirect:follow so the browser transparently follows 307 → presigned S3 URL
  const response = await fetch(`${baseUrl}/resume/${resumeId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error("Unable to load resume file.");
  }

  // Extract filename from Content-Disposition if present
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename[^;=\n]*=(?:(["'])([^"'\n]*)\1|([^\s;]+))/.exec(disposition);
  const filename = match?.[2] ?? match?.[3] ?? fallbackFilename;

  const blob = await response.blob();
  return { blobUrl: URL.createObjectURL(blob), filename };
}


export async function deleteResume(resumeId: string): Promise<void> {
  try {
    await api.delete<void>(`/resume/${resumeId}`, undefined, { auth: true });
  } catch (error) {
    if (error instanceof ApiError) throw new Error(error.detail);
    throw new Error("Unable to delete resume.");
  }
}
