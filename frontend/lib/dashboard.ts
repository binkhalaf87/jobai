import { listAIReports } from "@/lib/ai-reports";
import { listInterviews } from "@/lib/interviews";
import { getSavedJobs } from "@/lib/jobs";
import { listResumes } from "@/lib/resumes";
import { getHistory } from "@/lib/smart-send";
import { extractAtsScore } from "@/lib/product-insights";
import type { AIReportFull, AIReportListItem, InterviewListItem, ResumeListItem, SavedJob, SendHistoryItem } from "@/types";

type DashboardCollection<T> = {
  label: string;
  data: T[] | null;
  error: string | null;
};

export type DashboardActivityItem = {
  id: string;
  kind: "resume" | "saved-job" | "analysis-report" | "enhancement-report" | "interview" | "campaign";
  title: string;
  description: string;
  createdAt: string;
  href: string;
  status?: string | null;
};

export type DashboardJourneyStep =
  | "upload"
  | "analyze"
  | "improve"
  | "match"
  | "send"
  | "interview";

export type DashboardMetrics = {
  atsScore: number | null;
  jobsMatched: number | null;
  applicationsSent: number | null;
  interviewReadiness: number | null;
  activeResumeTitle: string | null;
  completedJourneySteps: number;
};

export type DashboardNextStep = {
  label: string;
  href: string;
  description: string;
  journeyStep: DashboardJourneyStep;
};

export type DashboardOverviewData = {
  resumes: DashboardCollection<ResumeListItem>;
  savedJobs: DashboardCollection<SavedJob>;
  analysisReports: DashboardCollection<AIReportListItem>;
  enhancementReports: DashboardCollection<AIReportListItem>;
  interviews: DashboardCollection<InterviewListItem>;
  campaigns: DashboardCollection<SendHistoryItem>;
  recentActivity: DashboardActivityItem[];
  latestAnalysisReport: AIReportFull | null;
  metrics: DashboardMetrics;
  nextStep: DashboardNextStep;
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

  const campaigns = (data.campaigns.data ?? []).map((campaign) => ({
    id: `campaign:${campaign.id}`,
    kind: "campaign" as const,
    title: campaign.company_name ? `${campaign.job_title} at ${campaign.company_name}` : campaign.job_title,
    description:
      campaign.status === "sent"
        ? `Email sent to ${campaign.recipient_email}.`
        : `Failed to send to ${campaign.recipient_email}.`,
    createdAt: campaign.created_at,
    href: "/dashboard/smart-send",
    status: campaign.status,
  }));

  return sortNewestFirst([
    ...resumes,
    ...savedJobs,
    ...analysisReports,
    ...enhancementReports,
    ...interviews,
    ...campaigns,
  ]).slice(0, 6);
}

function toReadinessScore(score: number | null): number | null {
  if (score === null) return null;
  return score <= 10 ? score * 10 : score;
}

async function loadLatestCompletedAnalysisReport(
  reports: AIReportListItem[] | null,
): Promise<AIReportFull | null> {
  const completedReport = reports?.find((report) => report.status === "completed") ?? null;
  if (!completedReport) return null;

  const { getAIReport } = await import("@/lib/ai-reports");
  try {
    return await getAIReport(completedReport.id);
  } catch {
    return null;
  }
}

function buildDashboardMetrics(overview: Omit<DashboardOverviewData, "metrics" | "nextStep">): DashboardMetrics {
  const parsedResumes = (overview.resumes.data ?? []).filter((resume) => resume.processing_status === "parsed");
  const savedJobs = overview.savedJobs.data ?? [];
  const interviews = overview.interviews.data ?? [];
  const campaigns = overview.campaigns.data ?? [];
  const completedInterviews = interviews.filter((item) => item.status === "completed" && item.overall_score != null);
  const readinessAverage =
    completedInterviews.length > 0
      ? completedInterviews.reduce((total, item) => total + (item.overall_score ?? 0), 0) / completedInterviews.length
      : null;

  const jobsWithFitScores = savedJobs.filter((job) => job.fit_score != null);
  const matchedJobsCount =
    jobsWithFitScores.length > 0
      ? jobsWithFitScores.filter((job) => (job.fit_score ?? 0) >= 55).length
      : savedJobs.length;

  const latestCompletedAnalysisText = overview.latestAnalysisReport?.report_text ?? null;
  const atsScore = extractAtsScore(latestCompletedAnalysisText);

  const hasImprovementReport = (overview.enhancementReports.data ?? []).some((report) => report.status === "completed");
  const applicationsSent = campaigns.filter((c) => c.status === "sent").length;

  const completedJourneySteps = [
    parsedResumes.length > 0,
    (overview.analysisReports.data ?? []).some((report) => report.status === "completed"),
    hasImprovementReport,
    matchedJobsCount > 0,
    applicationsSent > 0,
    completedInterviews.length > 0,
  ].filter(Boolean).length;

  return {
    atsScore,
    jobsMatched: overview.savedJobs.data ? matchedJobsCount : null,
    applicationsSent: overview.campaigns.data ? applicationsSent : null,
    interviewReadiness: toReadinessScore(readinessAverage),
    activeResumeTitle: parsedResumes[0]?.source_filename ?? parsedResumes[0]?.title ?? null,
    completedJourneySteps,
  };
}

function buildNextStep(overview: Omit<DashboardOverviewData, "metrics" | "nextStep">): DashboardNextStep {
  const parsedResumes = (overview.resumes.data ?? []).filter((resume) => resume.processing_status === "parsed");
  const hasAnalysis = (overview.analysisReports.data ?? []).some((report) => report.status === "completed");
  const hasEnhancement = (overview.enhancementReports.data ?? []).some((report) => report.status === "completed");
  const hasSavedJobs = (overview.savedJobs.data?.length ?? 0) > 0;
  const sentApplications = (overview.campaigns.data ?? []).filter((c) => c.status === "sent").length;
  const hasInterview = (overview.interviews.data ?? []).some((item) => item.status === "completed");

  if (parsedResumes.length === 0) {
    return {
      label: "Upload CV",
      href: "/dashboard/resumes",
      description: "Start by uploading a resume so the platform can parse and personalize the rest of the journey.",
      journeyStep: "upload",
    };
  }

  if (!hasAnalysis) {
    return {
      label: "Analyze CV",
      href: "/dashboard/analysis",
      description: "Run your first AI analysis to surface ATS quality, match readiness, and keyword gaps.",
      journeyStep: "analyze",
    };
  }

  if (!hasEnhancement) {
    return {
      label: "Improve CV",
      href: "/dashboard/enhancement",
      description: "Generate an improved rewrite before you start reaching out to companies.",
      journeyStep: "improve",
    };
  }

  if (!hasSavedJobs) {
    return {
      label: "Match Jobs",
      href: "/dashboard/job-search",
      description: "Search live jobs and save the strongest matches against your active resume.",
      journeyStep: "match",
    };
  }

  if (sentApplications === 0) {
    return {
      label: "Launch SmartSend",
      href: "/dashboard/smart-send",
      description: "Turn your saved opportunities into an outreach campaign and track delivery in one place.",
      journeyStep: "send",
    };
  }

  if (!hasInterview) {
    return {
      label: "Practice Interview",
      href: "/dashboard/ai-interview",
      description: "Use your role context and resume to rehearse before recruiter conversations begin.",
      journeyStep: "interview",
    };
  }

  return {
    label: "Review Dashboard",
    href: "/dashboard",
    description: "Your core journey is active. Review progress, then keep improving your strongest opportunities.",
    journeyStep: "interview",
  };
}

export async function loadDashboardOverview(): Promise<DashboardOverviewData> {
  const [resumes, savedJobs, analysisReports, enhancementReports, interviews, campaigns] = await Promise.all([
    loadCollection("Resumes", listResumes),
    loadCollection("Saved jobs", getSavedJobs),
    loadCollection("Analysis reports", () => listAIReports("analysis")),
    loadCollection("Enhancement reports", () => listAIReports("enhancement")),
    loadCollection("Interviews", listInterviews),
    loadCollection("Campaigns", getHistory),
  ]);

  const latestAnalysisReport = await loadLatestCompletedAnalysisReport(analysisReports.data);

  const overviewBase = {
    resumes,
    savedJobs,
    analysisReports,
    enhancementReports,
    interviews,
    campaigns,
    recentActivity: [],
    latestAnalysisReport,
  };

  const overview: DashboardOverviewData = {
    ...overviewBase,
    metrics: {
      atsScore: null,
      jobsMatched: null,
      applicationsSent: null,
      interviewReadiness: null,
      activeResumeTitle: null,
      completedJourneySteps: 0,
    },
    nextStep: {
      label: "Upload CV",
      href: "/dashboard/resumes",
      description: "Start by uploading a resume.",
      journeyStep: "upload",
    },
  };

  overview.recentActivity = createActivityFeed(overview);
  overview.metrics = buildDashboardMetrics(overview);
  overview.nextStep = buildNextStep(overview);
  return overview;
}
