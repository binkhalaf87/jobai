"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepBar } from "@/components/smart-send/StepBar";
import { getWizard, saveWizard } from "@/lib/wizard";

const LIMIT_OPTIONS = [10, 20, 50, 100, 200];

export default function SettingsPage() {
  const router = useRouter();
  const [dailyLimit, setDailyLimit] = useState(50);
  const [listCount, setListCount] = useState(0);

  useEffect(() => {
    const w = getWizard();
    if (w.daily_limit) setDailyLimit(w.daily_limit);
    if (w.list_count) setListCount(w.list_count);
  }, []);

  const estimatedDays = listCount > 0 ? Math.ceil(listCount / dailyLimit) : null;

  function handleNext() {
    saveWizard({ daily_limit: dailyLimit });
    router.push("/dashboard/smart-send/preview");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={4} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">إعدادات الإرسال</h1>
        <p className="text-sm text-slate-500 mt-1">حدد عدد الرسائل التي تريد إرسالها يومياً</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">الحد اليومي للإرسال</label>
          <div className="grid grid-cols-5 gap-2">
            {LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setDailyLimit(opt)}
                className={`rounded-xl border py-3 text-sm font-bold transition-colors ${dailyLimit === opt ? "bg-brand-800 text-white border-brand-800" : "bg-white text-slate-700 border-slate-200 hover:border-brand-300"}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            <label className="block text-xs text-slate-500">أو أدخل عدداً مخصصاً (1 – 500)</label>
            <input
              type="number"
              min={1}
              max={500}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Math.min(500, Math.max(1, Number(e.target.value))))}
              className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {estimatedDays !== null && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 flex items-center gap-3">
            <div className="text-2xl">📅</div>
            <div>
              <p className="text-sm font-semibold text-brand-800">
                تقدير مدة الحملة: <span className="text-brand-600">{estimatedDays} {estimatedDays === 1 ? "يوم" : "أيام"}</span>
              </p>
              <p className="text-xs text-brand-700 mt-0.5">
                {listCount.toLocaleString("ar")} جهة اتصال ÷ {dailyLimit} رسالة/يوم
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 space-y-1">
          <p className="font-semibold">تنبيه بشأن حدود Gmail</p>
          <p>يوصى بعدم تجاوز 100–200 رسالة/يوم تجنباً لتقييد حسابك من Google.</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/smart-send/list" className="text-sm text-slate-500 hover:text-slate-700">← العودة</Link>
        <button
          onClick={handleNext}
          className="bg-brand-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-700"
        >
          التالي ←
        </button>
      </div>
    </main>
  );
}
