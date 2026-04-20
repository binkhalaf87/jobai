"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, MapPin, Building2, Calendar, Users, Pencil, Trash2 } from "lucide-react";

import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

type JobListItem = {
  id: string;
  title: string;
  company_name: string | null;
  location: string | null;
  employment_type: EmploymentType | null;
  created_at: string;
  candidate_count: number;
  description: string | null;
};

type JobForm = {
  title: string;
  company_name: string;
  description: string;
  location: string;
  employment_type: EmploymentType | "";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: JobForm = {
  title: "", company_name: "", description: "", location: "", employment_type: "",
};

const EMPLOYMENT_TYPE_VALUES: EmploymentType[] = ["full_time", "part_time", "contract", "internship", "temporary"];

const TYPE_COLORS: Record<EmploymentType, string> = {
  full_time:  "bg-sky-50 text-sky-700 border-sky-200",
  part_time:  "bg-violet-50 text-violet-700 border-violet-200",
  contract:   "bg-amber-50 text-amber-700 border-amber-200",
  internship: "bg-emerald-50 text-emerald-700 border-emerald-200",
  temporary:  "bg-rose-50 text-rose-700 border-rose-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function jobToForm(job: JobListItem): JobForm {
  return {
    title: job.title,
    company_name: job.company_name ?? "",
    description: job.description ?? "",
    location: job.location ?? "",
    employment_type: job.employment_type ?? "",
  };
}

// ─── Job Form ─────────────────────────────────────────────────────────────────

function JobFormPanel({
  initial,
  submitLabel,
  onSave,
  onCancel,
}: {
  initial: JobForm;
  submitLabel: string;
  onSave: (form: JobForm) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("recruiter.jobsPage");
  const [form, setForm] = useState<JobForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof JobForm>(key: K, val: JobForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError(t("form.validationError"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">{t("form.jobTitle")} <span className="text-rose-500">{t("form.required")}</span></label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)}
            placeholder={t("form.titlePlaceholder")} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">{t("form.companyName")}</label>
          <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)}
            placeholder={t("form.companyPlaceholder")} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">{t("form.location")}</label>
          <input value={form.location} onChange={(e) => set("location", e.target.value)}
            placeholder={t("form.locationPlaceholder")} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">{t("form.employmentType")}</label>
          <select value={form.employment_type} onChange={(e) => set("employment_type", e.target.value as EmploymentType | "")}
            className={inputCls}>
            <option value="">{t("form.selectType")}</option>
            {EMPLOYMENT_TYPE_VALUES.map((val) => (
              <option key={val} value={val}>{t(`employmentTypes.${val}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700">{t("form.jobDescription")} <span className="text-rose-500">{t("form.required")}</span></label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={6} placeholder={t("form.jdPlaceholder")}
          className={`resize-y ${inputCls}`} />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
          {saving ? t("form.saving") : submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          {t("form.cancel")}
        </button>
      </div>
    </form>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  onUpdate,
  onDelete,
}: {
  job: JobListItem;
  onUpdate: (updated: JobListItem) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("recruiter.jobsPage");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(form: JobForm) {
    const updated = await api.patch<JobListItem>(`/recruiter/jobs/${job.id}`, {
      title: form.title.trim(),
      description: form.description.trim(),
      company_name: form.company_name.trim() || null,
      location: form.location.trim() || null,
      employment_type: form.employment_type || null,
    }, { auth: true });
    onUpdate(updated);
    setMode("view");
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/recruiter/jobs/${job.id}`, undefined, { auth: true });
      onDelete(job.id);
    } catch { /* ignore */ } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const descPreview = job.description
    ? job.description.length > 180 ? job.description.slice(0, 180) + "…" : job.description
    : null;

  return (
    <li className="rounded-2xl border border-slate-200 bg-white">
      {mode === "edit" ? (
        <div className="p-5 md:p-6">
          <p className="mb-4 text-sm font-semibold text-slate-900">{t("editJob")}</p>
          <JobFormPanel
            initial={jobToForm(job)}
            submitLabel={t("form.saveChanges")}
            onSave={handleSave}
            onCancel={() => setMode("view")}
          />
        </div>
      ) : (
        <div className="p-5 md:p-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-semibold text-slate-950">{job.title}</h2>
                {job.employment_type && (
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[job.employment_type]}`}>
                    {t(`employmentTypes.${job.employment_type}`)}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                {job.company_name && (
                  <span className="flex items-center gap-1">
                    <Building2 size={11} className="text-slate-400" />{job.company_name}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />{job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" />{fmtDate(job.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-slate-400" />
                  <span className="font-semibold text-slate-700">{job.candidate_count}</span>{" "}
                  {job.candidate_count === 1 ? t("card.candidatesScreened_one", { count: 1 }) : t("card.candidatesScreened_other", { count: job.candidate_count })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-1">
              {!confirmDelete ? (
                <>
                  <button type="button" onClick={() => setMode("edit")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                    <Pencil size={12} /> {t("card.edit")}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 size={12} /> {t("card.delete")}
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-rose-600 mr-1">{t("card.deleteConfirm")}</span>
                  <button type="button" onClick={() => void handleDelete()} disabled={deleting}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                    {deleting ? "…" : t("card.confirm")}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    {t("card.cancel")}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description preview */}
          {descPreview && (
            <p className="mt-3 text-xs leading-5 text-slate-500 line-clamp-3">{descPreview}</p>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterJobsPage() {
  const t = useTranslations("recruiter.jobsPage");
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get<JobListItem[]>("/recruiter/jobs/", { auth: true })
      .then((data) => { if (!cancelled) setJobs(data); })
      .catch(() => { if (!cancelled) setError(t("error")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  async function handleAdd(form: JobForm) {
    const created = await api.post<JobListItem>("/recruiter/jobs/", {
      title: form.title.trim(),
      description: form.description.trim(),
      company_name: form.company_name.trim() || undefined,
      location: form.location.trim() || undefined,
      employment_type: form.employment_type || undefined,
    }, { auth: true });
    setJobs((prev) => [created, ...prev]);
    setShowAdd(false);
  }

  function handleUpdate(updated: JobListItem) {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }

  function handleDelete(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Briefcase size={16} className="text-slate-500" />
          <p className="text-[15px] font-bold tracking-tight text-slate-900">{t("title")}</p>
          {jobs.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{jobs.length}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            showAdd ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {showAdd ? t("cancel") : t("addJob")}
        </button>
      </div>

      {/* ── Add form ── */}
      {showAdd && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <p className="mb-4 text-sm font-semibold text-slate-900">{t("newJob")}</p>
          <JobFormPanel
            initial={EMPTY_FORM}
            submitLabel={t("form.addJobBtn")}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <Briefcase size={24} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">{t("empty.title")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("empty.desc")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
