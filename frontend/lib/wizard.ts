export interface WizardState {
  subject: string;
  body: string;
  resume_id: string;
  resume_name: string;
  list_id: string;
  list_name: string;
  list_count: number;
  daily_limit: number;
  job_title: string;
  company_name: string;
}

const KEY = "jobai_smartsend_wizard";

export function getWizard(): Partial<WizardState> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

export function saveWizard(data: Partial<WizardState>): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify({ ...getWizard(), ...data }));
}

export function clearWizard(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
