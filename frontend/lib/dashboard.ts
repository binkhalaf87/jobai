import { listAIReports } from "@/lib/ai-reports";
import { listInterviews } from "@/lib/interviews";
import { getSavedJobs } from "@/lib/jobs";
import { listResumes } from "@/lib/resumes";
import type { AIReportListItem, InterviewListItem, ResumeListItem, SavedJob } from "@/types";

type DashboardCollection<T> = {
  label: string;
  data: T[] | null;
  error: string | null;
};

export type DashboardActivityItem = {
  id: string;
  kind: "resume" | "saved-job" | "analysis-report" | "enhancement-report" | "interview";
  title: string;
  description: string;
  createdAt: string;
  href: string;
  status?: string | null;
};

export type DashboardOverviewData = {
  resumes: DashboardCollection<ResumeListItem>;
  savedJobs: DashboardCollection<SavedJob>;
  analysisReports: DashboardCollection<AIReportListItem>;
  enhancementReports: DashboardCollection<AIReportListItem>;
  interviews: DashboardCollection<InterviewListItem>;
  recentActivity: DashboardActivityItem[];
};

async function loadCollection<T>(
  label: string,
  loader: () => Promise<T[]>,
): Promise<DashboardCollection<T>> {
  try {
    return {
      label,
      data: await loader(),
      error: null,
    };
  } catch (error) {
    return {
      label,
      data: null,
      error: error instanceof Error ? error.message : `Unable to load ${label.toLowerCase()}.`,
    };
  }
}

function sortNewestFirst<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftDate = Date.parse(left.createdAt);
    const rightDate = Date.parse(right.createdAt);
    return rightDate - leftDate;
  });
}

function createActivityFeed(data: DashboardOverviewData): DashboardActivityItem[] {
  const resumes = (data.resumes.data ?? []).map((resume) => ({
    id: `resume:${resume.id}`,
    kind: "resume" as const,
    title: resume.source_filename ?? resume.title,
    description:
      resume.processing_status === "parsed"
        ? "Resume uploaded and parsed."
        : `Resume status: ${resume.processing_status}.`,
    createdAt: resume.created_at,
    href: "/dashboard/resumes",
    status: resume.processing_status,
  }));

  const savedJobs = (data.savedJobs.data ?? []).map((job) => ({
    id: `saved-job:${job.id}`,
    kind: "saved-job" as const,
    title: `${job.job_title} at ${job.company_name}`,
    description: "Saved to your job list.",
    createdAt: job.created_at,
    href: "/dashboard/job-search",
  }));

  const analysisReports = (data.analysisReports.data ?? []).map((report) => ({
    id: `analysis-report:${report.id}`,
    kind: "analysis-report" as const,
    title: report.resume_title ?? "Analysis report",
    description: `Analysis report ${report.status}.`,
    createdAt: report.created_at,
    href: "/dashboard/analysis",
    status: report.status,
  }));

  const enhancementReports = (data.enhancementReports.data ?? []).map((report) => ({
    id: `enhancement-report:${report.id}`,
    kind: "enhancement-report" as const,
    title: report.resume_title ?? "Enhancement report",
    description: `Enhancement report ${report.status}.`,
    createdAt: report.created_at,
    href: "/dashboard/enhancement",
    status: report.status,
  }));

  const interviews = (data.interviews.data ?? []).map((interview) => ({
    id: `interview:${interview.id}`,
    kind: "interview" as const,
    title: interview.job_title,
    description:
      interview.status === "completed"
        ? `Interview completed${interview.overall_score != null ? ` with ${Math.round(interview.overall_score)}% score.` : "."}`
        : `Interview status: ${interview.status}.`,
    createdAt: interview.created_at,
    href: "/dashboard/ai-interview",
    status: interview.status,
  }));

  return sortNewestFirst([
    ...resumes,
    ...savedJobs,
    ...analysisReports,
    ...enhancementReports,
    ...interviews,
  ]).slice(0, 6);
}

export async function loadDashboardOverview(): Promise<DashboardOverviewData> {
  const [resumes, savedJobs, analysisReports, enhancementReports, interviews] = await Promise.all([
    loadCollection("Resumes", listResumes),
    loadCollection("Saved jobs", getSavedJobs),
    loadCollection("Analysis reports", () => listAIReports("analysis")),
    loadCollection("Enhancement reports", () => listAIReports("enhancement")),
    loadCollection("Interviews", listInterviews),
  ]);

  const overview: DashboardOverviewData = {
    resumes,
    savedJobs,
    analysisReports,
    enhancementReports,
    interviews,
    recentActivity: [],
  };

  overview.recentActivity = createActivityFeed(overview);
  return overview;
}
