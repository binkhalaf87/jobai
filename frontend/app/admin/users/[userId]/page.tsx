"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

import {
  getAdminUserProfile,
  type AdminUserProfileResponse,
  type AdminUserActivityItem,
  type AdminUserResumeItem,
  type AdminUserServiceSummaryItem,
} from "@/lib/admin";

const ROLE_COLORS: Record<string, string> = {
  jobseeker: "bg-brand-100 text-brand-700",
  recruiter: "bg-violet-100 text-violet-700",
  admin: "bg-slate-800 text-white",
};

const EVENT_ICONS: Record<string, string> = {
  analysis_requested: "🔍",
  analysis_completed: "✅",
  rewrite_generated: "✏️",
  auth_login: "🔑",
  auth_register: "👤",
  auth_logout: "🚪",
  auth_token_refresh: "🔄",
  auth_email_verified: "📧",
  auth_email_verification_resent: "📨",
  auth_password_reset_requested: "🔓",
  auth_password_reset_completed: "🔐",
  resume_uploaded: "📄",
  resume_deleted: "🗑️",
  file_deleted: "🗑️",
  billing_checkout_initiated: "💳",
  billing_payment_confirmed: "💰",
  billing_promo_applied: "🏷️",
  smtp_connected: "📧",
  smtp_deleted: "📭",
  admin_user_updated: "⚙️",
  admin_wallet_adjusted: "💵",
  admin_promo_created: "🎟️",
  admin_promo_deleted: "❌",
};

const EVENT_LABELS: Record<string, string> = {
  analysis_requested: "طلب تحليل",
  analysis_completed: "اكتمل التحليل",
  rewrite_generated: "إعادة كتابة",
  auth_login: "تسجيل دخول",
  auth_register: "تسجيل حساب",
  auth_logout: "تسجيل خروج",
  auth_token_refresh: "تجديد الجلسة",
  auth_email_verified: "تأكيد البريد",
  auth_email_verification_resent: "إعادة إرسال التأكيد",
  auth_password_reset_requested: "طلب إعادة تعيين كلمة المرور",
  auth_password_reset_completed: "إعادة تعيين كلمة المرور",
  resume_uploaded: "رفع سيرة ذاتية",
  resume_deleted: "حذف سيرة ذاتية",
  file_deleted: "حذف ملف",
  billing_checkout_initiated: "بدء الدفع",
  billing_payment_confirmed: "تأكيد الدفع",
  billing_promo_applied: "تطبيق كود خصم",
  smtp_connected: "ربط SMTP",
  smtp_deleted: "إلغاء SMTP",
  admin_user_updated: "تحديث مستخدم",
  admin_wallet_adjusted: "تعديل المحفظة",
  admin_promo_created: "إنشاء كود خصم",
  admin_promo_deleted: "حذف كود خصم",
};

const STATUS_COLORS: Record<string, string> = {
  parsed: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  uploaded: "bg-slate-100 text-slate-600",
  failed: "bg-rose-100 text-rose-700",
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "bg-rose-100 text-rose-700",
  docx: "bg-blue-100 text-blue-700",
  doc: "bg-blue-100 text-blue-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function ActivityTab({
  items,
  total,
  page,
  pageSize,
  onPageChange,
}: {
  items: AdminUserActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">لا يوجد نشاط مسجّل.</p>;
  }
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
          <span className="mt-0.5 text-base leading-none">
            {EVENT_ICONS[item.event_type] ?? "📋"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800">
              {EVENT_LABELS[item.event_type] ?? item.event_type.replace(/_/g, " ")}
            </p>
            {item.detail && (
              <p className="text-[11px] text-slate-400 truncate">{item.detail}</p>
            )}
            {item.credits_used > 0 && (
              <p className="text-[11px] text-amber-600">−{item.credits_used} نقطة</p>
            )}
          </div>
          <p className="shrink-0 text-[11px] text-slate-400">{formatDateTime(item.created_at)}</p>
        </div>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">{total} حدث</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-600">{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ServicesTab({ summary }: { summary: AdminUserServiceSummaryItem[] }) {
  if (summary.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">لا توجد خدمات مستخدمة.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {summary.map((item) => (
        <div
          key={item.event_type}
          className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center"
        >
          <span className="text-2xl">{EVENT_ICONS[item.event_type] ?? "📋"}</span>
          <p className="text-xs font-semibold text-slate-700 leading-snug">
            {EVENT_LABELS[item.event_type] ?? item.event_type.replace(/_/g, " ")}
          </p>
          <span className="rounded-full bg-slate-900 px-3 py-0.5 text-xs font-bold text-white">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function FilesTab({ resumes }: { resumes: AdminUserResumeItem[] }) {
  if (resumes.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">لم يرفع هذا المستخدم أي ملفات.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-3 py-2">العنوان</th>
            <th className="px-3 py-2">اسم الملف</th>
            <th className="px-3 py-2">النوع</th>
            <th className="px-3 py-2">الحالة</th>
            <th className="px-3 py-2">الصفحات</th>
            <th className="px-3 py-2">التاريخ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {resumes.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/50">
              <td className="px-3 py-2.5 font-medium text-slate-800 text-[13px] max-w-[140px] truncate">
                {r.title}
              </td>
              <td className="px-3 py-2.5 text-[11px] text-slate-500 max-w-[160px] truncate">
                {r.source_filename ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                {r.file_type ? (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${FILE_TYPE_COLORS[r.file_type] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.file_type.toUpperCase()}
                  </span>
                ) : "—"}
              </td>
              <td className="px-3 py-2.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[r.processing_status] ?? "bg-slate-100 text-slate-600"}`}>
                  {r.processing_status}
                </span>
              </td>
              <td className="px-3 py-2.5 text-[12px] text-slate-500">
                {r.page_count ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-[11px] text-slate-400">
                {formatDate(r.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Tab = "activity" | "services" | "files";

export default function AdminUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<AdminUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("activity");
  const [activityPage, setActivityPage] = useState(1);
  const PAGE_SIZE = 50;

  function load(page: number) {
    setLoading(true);
    setError(null);
    getAdminUserProfile(userId, { activityPage: page, activityPageSize: PAGE_SIZE })
      .then(setProfile)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(activityPage); }, [activityPage]);

  function handlePageChange(p: number) {
    setActivityPage(p);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error ?? "لم يتم العثور على المستخدم."}
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "activity", label: "النشاط" },
    { key: "services", label: "الخدمات" },
    { key: "files", label: `الملفات (${profile.resumes.length})` },
  ];

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft size={13} />
        العودة للمستخدمين
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
            {initials(profile.full_name, profile.email)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[15px] font-bold text-slate-900 truncate">
                {profile.full_name ?? profile.email}
              </h1>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[profile.role] ?? "bg-slate-100 text-slate-600"}`}>
                {profile.role}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${profile.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {profile.is_active ? "نشط" : "غير نشط"}
              </span>
              {profile.is_email_verified && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  بريد مؤكد ✓
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-slate-400">{profile.email}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">الرصيد</p>
              <p className="text-[15px] font-bold text-slate-900">{profile.balance_points ?? 0} نقطة</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">انضم</p>
              <p className="text-[13px] font-semibold text-slate-700">{formatDate(profile.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">آخر دخول</p>
              <p className="text-[13px] font-semibold text-slate-700">
                {profile.last_login_at ? formatDate(profile.last_login_at) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-[13px] font-semibold transition ${
                tab === t.key
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "activity" && (
            <ActivityTab
              items={profile.activity}
              total={profile.activity_total}
              page={activityPage}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          )}
          {tab === "services" && <ServicesTab summary={profile.services_summary} />}
          {tab === "files" && <FilesTab resumes={profile.resumes} />}
        </div>
      </div>
    </div>
  );
}
