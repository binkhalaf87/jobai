import { api, ApiError } from "@/lib/api";
import type { ResumeUploadResponse } from "@/types";


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
