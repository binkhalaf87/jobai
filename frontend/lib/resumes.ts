import { api, ApiError } from "@/lib/api";
import type { ResumeListItem, ResumePreview, ResumeUploadResponse } from "@/types";


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


export async function getResumePreview(resumeId: string): Promise<ResumePreview> {
  try {
    return await api.get<ResumePreview>(`/resume/${resumeId}`, { auth: true });
  } catch (error) {
    if (error instanceof ApiError) throw new Error(error.detail);
    throw new Error("Unable to load resume preview.");
  }
}


export async function deleteResume(resumeId: string): Promise<void> {
  try {
    await api.delete<void>(`/resume/${resumeId}`, undefined, { auth: true });
  } catch (error) {
    if (error instanceof ApiError) throw new Error(error.detail);
    throw new Error("Unable to delete resume.");
  }
}
