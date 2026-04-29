"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Briefcase, FileText, Send, Shield } from "lucide-react";

import { getAdminStats, type AdminStatsResponse } from "@/lib/admin";

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon size={14} className="text-white" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">
        {value === null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load stats"));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-[15px] font-bold text-slate-900">Platform Overview</p>
        <p className="mt-0.5 text-xs text-slate-500">Real-time counts across all platform entities.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Users"    value={stats?.total_users ?? null}    icon={Users}     color="bg-slate-800" />
        <StatCard label="Active Users"   value={stats?.active_users ?? null}   icon={UserCheck}  color="bg-emerald-600" />
        <StatCard label="Jobseekers"     value={stats?.jobseekers ?? null}      icon={FileText}  color="bg-brand-600" />
        <StatCard label="Recruiters"     value={stats?.recruiters ?? null}      icon={Briefcase} color="bg-violet-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Admins"           value={stats?.admins ?? null}           icon={Shield}   color="bg-slate-900" />
        <StatCard label="Resumes Uploaded" value={stats?.total_resumes ?? null}    icon={FileText} color="bg-sky-600" />
        <StatCard label="Emails Sent"      value={stats?.total_sends ?? null}      icon={Send}     color="bg-teal-600" />
      </div>
    </div>
  );
}
