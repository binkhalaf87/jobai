import { api, ApiError } from "@/lib/api";
import type {
  AnalysisFullResponse,
  AnalysisRequestPayload,
  RewriteSuggestionRequestPayload,
  RewriteSuggestionResponse
} from "@/types";

// This helper keeps analysis requests isolated so future analysis endpoints can share one client module.
export async function runFullAnalysis(payload: AnalysisRequestPayload): Promise<AnalysisFullResponse> {
  try {
    return await api.post<AnalysisFullResponse>("/analysis/analyze", payload, {
      auth: true
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.detail);
    }

    throw new Error("Unable to run the analysis right now.");
  }
}

// This helper sends one source bullet or section to the rewrite endpoint and returns saved AI suggestions.
export async function generateRewriteSuggestions(
  payload: RewriteSuggestionRequestPayload
): Promise<RewriteSuggestionResponse> {
  try {
    return await api.post<RewriteSuggestionResponse>("/analysis/rewrite", payload, {
      auth: true
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.detail);
    }

    throw new Error("Unable to generate rewrite suggestions right now.");
  }
}
