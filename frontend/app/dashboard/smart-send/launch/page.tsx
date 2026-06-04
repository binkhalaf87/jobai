"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { StepBar } from "@/components/smart-send/StepBar";
import { getCampaigns } from "@/lib/smart-send";
import type { Campaign } from "@/types";

function LaunchContent() {
  const params = useSearchParams();
  const campaignId = params.get("campaign_id");
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    getCampaigns().then((list) => {
      const found = list.find((c) => c.id === campaignId);
      if (found) setCampaign(found);
    }).catch(() => {});
  }, [campaignId]);

  return (
    <>
      <div className="text-center py-8 space-y-4">
        <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto text-4xl">🚀</div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">تم إطلاق الحملة!</h1>
          <p className="text-sm text-slate-500 mt-2">سيبدأ الإرسال تلقائياً خلال دقائق</p>
        </div>
      </div>

      {campaign && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700 mb-3">تفاصيل الحملة</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">القائمة</p>
              <p className="font-semibold text-slate-800 mt-0.5">{campaign.list_name ?? "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">إجمالي جهات الاتصال</p>
              <p className="font-semibold text-slate-800 mt-0.5">{campaign.total_contacts.toLocaleString("ar")}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">الحد اليومي</p>
              <p className="font-semibold text-slate-800 mt-0.5">{campaign.daily_limit} رسالة/يوم</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">المدة التقديرية</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {campaign.estimated_days_remaining} {campaign.estimated_days_remaining === 1 ? "يوم" : "أيام"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-xs text-brand-700 space-y-1">
        <p className="font-semibold">كيف يعمل الإرسال؟</p>
        <p>يتم إرسال رسائلك تدريجياً بفواصل زمنية طبيعية لتفادي قيود Gmail. يمكنك متابعة الحالة من صفحة الحملات.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/smart-send/campaigns"
          className="block bg-brand-800 text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-700 text-center"
        >
          عرض الحملات
        </Link>
        <Link
          href="/dashboard/smart-send/letter"
          className="block border border-slate-200 text-slate-700 rounded-xl py-3 text-sm font-semibold hover:bg-slate-50 text-center"
        >
          بدء حملة جديدة
        </Link>
      </div>
    </>
  );
}

export default function LaunchPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={6} />
      <Suspense fallback={<div className="h-48 bg-slate-100 rounded-xl animate-pulse" />}>
        <LaunchContent />
      </Suspense>
    </main>
  );
}
