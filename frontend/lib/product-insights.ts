import type { JobResult } from "@/types";

const KEYWORD_STOPWORDS = new Set([
  "about",
  "across",
  "after",
  "also",
  "been",
  "between",
  "candidate",
  "candidates",
  "company",
  "experience",
  "from",
  "have",
  "highly",
  "into",
  "job",
  "looking",
  "must",
  "need",
  "needs",
  "role",
  "team",
  "their",
  "this",
  "with",
  "will",
  "your",
]);

export function extractAtsScore(text: string | null | undefined): number | null {
  if (!text) return null;

  const explicitScore = text.match(/\*\*ATS Score:\s*(\d+)\/100\*\*/i);
  if (explicitScore) {
    return Number.parseInt(explicitScore[1], 10);
  }

  const genericScore = text.match(/ATS[^0-9]{0,20}(\d{1,3})\s*\/\s*100/i);
  if (genericScore) {
    return Number.parseInt(genericScore[1], 10);
  }

  return null;
}

export function atsLabel(score: number | null): string {
  if (score === null) return "Unavailable";
  if (score >= 80) return "Strong";
  if (score >= 65) return "Competitive";
  if (score >= 50) return "Improving";
  return "Needs attention";
}

export function interviewReadinessLabel(score: number | null): string {
  if (score === null) return "Not started";
  if (score >= 80) return "Interview ready";
  if (score >= 65) return "Almost ready";
  if (score >= 50) return "Needs coaching";
  return "Needs practice";
}

function extractFocusKeywords(description: string | null | undefined): string[] {
  if (!description) return [];

  const counts = new Map<string, number>();
  const matches = description.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? [];

  for (const token of matches) {
    if (KEYWORD_STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([keyword]) => keyword);
}

export type JobMatchInsights = {
  headline: string;
  reasons: string[];
  suggestions: string[];
};

export function buildJobMatchInsights(job: JobResult): JobMatchInsights {
  const focusKeywords = extractFocusKeywords(job.job_description);
  const fitScore = job.fit_score;

  const reasons: string[] = [];
  const suggestions: string[] = [];

  if (fitScore !== null) {
    if (fitScore >= 75) {
      reasons.push("Your resume already aligns strongly with this role.");
      suggestions.push("Apply now, then tailor your opening summary to this title.");
    } else if (fitScore >= 55) {
      reasons.push("You have a workable base match with room to improve relevance.");
      suggestions.push("Mirror the strongest role keywords in your summary and experience bullets.");
    } else {
      reasons.push("This role is only a partial fit based on your current resume.");
      suggestions.push("Strengthen role-specific keywords before applying.");
    }
  } else {
    reasons.push("Fit scoring is off because no resume was selected for comparison.");
    suggestions.push("Select an active resume to unlock personalized fit scoring.");
  }

  if (focusKeywords.length > 0) {
    reasons.push(`The job description repeatedly emphasizes ${focusKeywords.slice(0, 3).join(", ")}.`);
    suggestions.push(`Show evidence for ${focusKeywords.slice(0, 2).join(" and ")} in your CV or cover email.`);
  }

  if (job.location) {
    reasons.push(`Location context is ${job.location}, which helps you qualify the opportunity quickly.`);
  }

  if (job.employment_type) {
    suggestions.push(`Confirm your resume or outreach message matches the ${job.employment_type.toLowerCase()} nature of the role.`);
  }

  return {
    headline:
      fitScore === null
        ? "Add resume scoring to understand the match."
        : fitScore >= 75
          ? "High-priority role"
          : fitScore >= 55
            ? "Promising match"
            : "Needs tailoring",
    reasons: reasons.slice(0, 3),
    suggestions: suggestions.slice(0, 3),
  };
}
