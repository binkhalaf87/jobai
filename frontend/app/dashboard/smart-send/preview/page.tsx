"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepBar } from "@/components/smart-send/StepBar";
import { createCampaign } from "@/lib/smart-send";
import { getWizard, clearWizard } from "@/lib/wizard";
import type { WizardState } from "@/lib/wizard";

export default function PreviewPage() {
  const router = useRouter();
  const [wizard, setWizard] = useState<Partial<WizardState>>({});
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setWizard(getWizard());
  }, []);

  const estimatedDays = wizard.list_count && wizard.daily_limit
    ? Math.ceil(wizard.list_count / wizard.daily_limit)
    : null;

  async function handleLaunch() {
    if (!wizard.list_id || !wizard.subject || !wizard.body) {
      setError("البيانات غير مكتملة. ارجع وتحقق من الخطوات السابقة.");
      return;
    }
    setLaunching(true); setError("");
    try {
      const campaign = await createCampaign({
        list_id: wizard.list_id,
        subject: wizard.subject,
        body: wizard.body,
        resume_id: wizard.resume_id || undefined,
        daily_limit: wizard.daily_limit,
      });
      clearWizard();
      router.push(`/dashboard/smart-send/launch?campaign_id=${campaign.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل إطلاق الحملة. حاول مرة أخرى.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={5} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">مراجعة الحملة</h1>
        <p className="text-sm text-slate-500 mt-1">راجع جميع التفاصيل قبل إطلاق الحملة</p>
      </div>

      <div className="space-y-3">
        {/* Letter */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">✉️</span>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">الخطاب</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">{wizard.subject || <span className="text-rose-500">غير محدد</span>}</p>
          {wizard.job_title && (
            <p className="text-xs text-slate-500">
              {wizard.job_title}{wizard.company_name ? ` — ${wizard.company_name}` : ""}
            </p>
          )}
          {wizard.body && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 whitespace-pre-wrap">{wizard.body}</p>
          )}
          <Link href="/dashboard/smart-send/letter" className="text-xs text-brand-600 hover:underline mt-1 inline-block">تعديل</Link>
        </div>

        {/* Resume */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📄</span>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">السيرة الذاتية</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {wizard.resume_name || (wizard.resume_id ? "سيرة ذاتية محددة" : <span className="text-amber-600">لم تُحدد سيرة ذاتية</span>)}
          </p>
          <Link href="/dashboard/smart-send/resume" className="text-xs text-brand-600 hover:underline mt-1 inline-block">تعديل</Link>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">👥</span>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">قائمة الإرسال</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">{wizard.list_name || <span className="text-rose-500">غير محدد</span>}</p>
          {wizard.list_count !== undefined && (
            <p className="text-xs text-brand-600 font-medium mt-0.5">{wizard.list_count.toLocaleString("ar")} جهة اتصال</p>
          )}
          <Link href="/dashboard/smart-send/list" className="text-xs text-brand-600 hover:underline mt-1 inline-block">تعديل</Link>
        </div>

        {/* Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">⚙️</span>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">إعدادات الإرسال</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">{wizard.daily_limit ?? 50} رسالة/يوم</p>
          {estimatedDays && (
            <p className="text-xs text-slate-500 mt-0.5">مدة تقديرية: {estimatedDays} {estimatedDays === 1 ? "يوم" : "أيام"}</p>
          )}
          <Link href="/dashboard/smart-send/settings" className="text-xs text-brand-600 hover:underline mt-1 inline-block">تعديل</Link>
        </div>
      </div>

      {!wizard.resume_id && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ لم تختر سيرة ذاتية — سيتم الإرسال بدون مرفق. يُنصح بإرفاق سيرتك الذاتية.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/smart-send/settings" className="text-sm text-slate-500 hover:text-slate-700">← العودة</Link>
        <button
          onClick={handleLaunch}
          disabled={launching || !wizard.list_id || !wizard.subject}
          className="bg-brand-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {launching ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جارٍ الإطلاق...</>
          ) : "إطلاق الحملة 🚀"}
        </button>
      </div>
    </main>
  );
}
