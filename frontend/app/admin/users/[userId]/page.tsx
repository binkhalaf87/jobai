"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft, Download, Eye, X } from "lucide-react";

import {
  getAdminUserProfile,
  getAdminResumeFileUrl,
  grantFeatureCredits,
  type AdminUserProfileResponse,
  type AdminUserActivityItem,
  type AdminUserResumeItem,
  type AdminUserServiceSummaryItem,
  type AdminUserPageViewItem,
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

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "الرئيسية",
  "/dashboard/resumes": "السير الذاتية",
  "/dashboard/analysis": "تحليل السيرة",
  "/dashboard/enhancement": "تحسين السيرة",
  "/dashboard/cover-letter": "خطاب التقديم",
  "/dashboard/mock-interview": "تدريب المقابلة",
  "/dashboard/jobs": "البحث عن وظائف",
  "/dashboard/smart-send": "الإرسال الذكي",
  "/dashboard/billing": "الفواتير",
  "/dashboard/profile": "الملف الشخصي",
  "/dashboard/support": "الدعم",
};

function PagesTab({ items, total }: { items: AdminUserPageViewItem[]; total: number }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">لم يتم تسجيل أي زيارات للصفحات.</p>;
  }

  // Group by path with counts for summary, keep raw list below
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.path] = (counts[item.path] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      {/* Summary grid */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">الصفحات الأكثر زيارة</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sorted.slice(0, 9).map(([path, count]) => (
            <div key={path} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-slate-700">
                  {PAGE_LABELS[path] ?? (path.replace("/dashboard/", "").replace("/", " / ") || "الرئيسية")}
                </p>
                <p className="truncate text-[10px] text-slate-400">{path}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent visits list */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          آخر الزيارات ({total} إجمالي)
        </p>
        <div className="space-y-0.5">
          {items.slice(0, 50).map((item, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
              <span className="text-sm">🔗</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800">
                  {PAGE_LABELS[item.path] ?? item.path}
                </p>
                <p className="text-[10px] text-slate-400">{item.path}</p>
              </div>
              <p className="shrink-0 text-[11px] text-slate-400">{formatDateTime(item.created_at)}</p>
            </div>
          ))}
        </div>
      </div>
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

function PreviewModal({
  url,
  filename,
  fileType,
  onClose,
}: {
  url: string;
  filename: string;
  fileType: string | null;
  onClose: () => void;
}) {
  const isPdf = fileType === "pdf";
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between bg-slate-900 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="truncate text-sm font-semibold text-white">{filename}</p>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download={filename}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={12} />
            تنزيل
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {isPdf ? (
          <iframe
            src={url}
            className="h-full w-full"
            title={filename}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-white">
            <p className="text-lg font-semibold">لا تتوفر معاينة لهذا النوع من الملفات</p>
            <p className="text-sm text-slate-400">صيغة {fileType?.toUpperCase() ?? "غير معروفة"} لا تدعم المعاينة في المتصفح</p>
            <a
              href={url}
              download={filename}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              <Download size={14} />
              تنزيل الملف
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function FilesTab({
  resumes,
  userId,
}: {
  resumes: AdminUserResumeItem[];
  userId: string;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; filename: string; fileType: string | null } | null>(null);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  const fetchFile = useCallback(
    async (resume: AdminUserResumeItem, mode: "preview" | "download") => {
      const key = `${resume.id}_${mode}`;
      setLoadingId(key);
      try {
        const cached = blobUrls[key];
        const url = cached ?? await getAdminResumeFileUrl(userId, resume.id, mode === "preview");
        if (!cached) setBlobUrls((prev) => ({ ...prev, [key]: url }));

        if (mode === "preview") {
          setPreview({
            url,
            filename: resume.source_filename ?? resume.title,
            fileType: resume.file_type,
          });
        } else {
          const a = document.createElement("a");
          a.href = url;
          a.download = resume.source_filename ?? resume.title;
          a.click();
        }
      } catch {
        /* ignore — could add a toast here */
      } finally {
        setLoadingId(null);
      }
    },
    [userId, blobUrls],
  );

  if (resumes.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">لم يرفع هذا المستخدم أي ملفات.</p>;
  }

  return (
    <>
      {preview && (
        <PreviewModal
          url={preview.url}
          filename={preview.filename}
          fileType={preview.fileType}
          onClose={() => setPreview(null)}
        />
      )}
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
              <th className="px-3 py-2">الإجراءات</th>
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
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={loadingId === `${r.id}_preview`}
                      onClick={() => void fetchFile(r, "preview")}
                      title="معاينة"
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
                    >
                      {loadingId === `${r.id}_preview` ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-slate-700" />
                      ) : (
                        <Eye size={11} />
                      )}
                      معاينة
                    </button>
                    <button
                      type="button"
                      disabled={loadingId === `${r.id}_download`}
                      onClick={() => void fetchFile(r, "download")}
                      title="تنزيل"
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40"
                    >
                      {loadingId === `${r.id}_download` ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-slate-700" />
                      ) : (
                        <Download size={11} />
                      )}
                      تنزيل
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Grant Credits Modal ───────────────────────────────────────────────────────

const FEATURE_OPTIONS = [
  { value: "smart_send_contacts", label: "إرسال ذكي (شركات)" },
  { value: "resume_analysis",     label: "تحليل سيرة ذاتية" },
  { value: "resume_improvement",  label: "تحسين سيرة ذاتية" },
  { value: "mock_interview",      label: "تدريب مقابلة" },
] as const;

function GrantCreditsModal({
  userId,
  userEmail,
  currentCredits,
  onClose,
  onDone,
}: {
  userId: string;
  userEmail: string;
  currentCredits: Record<string, number>;
  onClose: () => void;
  onDone: (updated: Record<string, number>) => void;
}) {
  const [feature, setFeature] = useState<string>("smart_send_contacts");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) { setError("أدخل عدداً صحيحاً موجباً."); return; }
    if (!reason.trim()) { setError("السبب مطلوب."); return; }
    setLoading(true); setError(null);
    try {
      const updated = await grantFeatureCredits(userId, { feature, quantity: qty, reason: reason.trim() });
      onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل منح الرصيد");
    } finally {
      setLoading(false);
    }
  }

  const selectedLabel = FEATURE_OPTIONS.find((f) => f.value === feature)?.label ?? feature;
  const currentBalance = currentCredits[feature] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-sm font-bold text-slate-900">منح رصيد</p>
        <p className="mt-0.5 text-xs text-slate-500">{userEmail}</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          {/* Feature */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">نوع الخدمة</label>
            <select
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              {FEATURE_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              الرصيد الحالي: <span className="font-semibold text-slate-700">{currentBalance.toLocaleString()}</span>
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الكمية المضافة</label>
            <input
              type="number"
              min={1}
              placeholder="مثال: 500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            {quantity && parseInt(quantity) > 0 && (
              <p className="mt-1 text-xs text-emerald-600">
                الرصيد بعد الإضافة: {(currentBalance + parseInt(quantity)).toLocaleString()} {selectedLabel}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">السبب</label>
            <input
              type="text"
              placeholder="مثال: تعويض، هدية، ..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600">
              إلغاء
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-700">
              {loading ? "…" : "منح الرصيد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Tab = "activity" | "services" | "pages" | "files";

export default function AdminUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<AdminUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("activity");
  const [activityPage, setActivityPage] = useState(1);
  const [showGrantModal, setShowGrantModal] = useState(false);
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
    { key: "pages", label: `الصفحات (${profile.pages_total})` },
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">إرسال ذكي</p>
              <p className="text-[15px] font-bold text-slate-900">
                {(profile.feature_credits["smart_send_contacts"] ?? 0).toLocaleString()} شركة
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">تحليل</p>
              <p className="text-[15px] font-bold text-slate-900">
                {profile.feature_credits["resume_analysis"] ?? 0}
              </p>
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

        {/* Grant credits button */}
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowGrantModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
          >
            + منح رصيد
          </button>
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
          {tab === "pages" && <PagesTab items={profile.pages_visited} total={profile.pages_total} />}
          {tab === "files" && <FilesTab resumes={profile.resumes} userId={profile.id} />}
        </div>
      </div>

      {/* Grant Credits Modal */}
      {showGrantModal && (
        <GrantCreditsModal
          userId={profile.id}
          userEmail={profile.email}
          currentCredits={profile.feature_credits}
          onClose={() => setShowGrantModal(false)}
          onDone={(updated) => {
            setProfile((p) => p ? { ...p, feature_credits: updated } : p);
            setShowGrantModal(false);
          }}
        />
      )}
    </div>
  );
}
