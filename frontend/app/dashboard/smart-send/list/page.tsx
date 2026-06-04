"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepBar } from "@/components/smart-send/StepBar";
import { getRecipientLists } from "@/lib/smart-send";
import { getWizard, saveWizard } from "@/lib/wizard";
import type { RecipientList } from "@/types";

export default function ListPage() {
  const router = useRouter();
  const [lists, setLists] = useState<RecipientList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    getRecipientLists()
      .then(setLists)
      .catch(() => {})
      .finally(() => setLoading(false));
    const w = getWizard();
    if (w.list_id) setSelectedId(w.list_id);
  }, []);

  function handleNext() {
    const list = lists.find((l) => l.id === selectedId);
    saveWizard({ list_id: selectedId, list_name: list?.name ?? "", list_count: list?.total_count ?? 0 });
    router.push("/dashboard/smart-send/settings");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={3} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">اختر قائمة الإرسال</h1>
        <p className="text-sm text-slate-500 mt-1">سيتم إرسال الخطاب لجميع جهات الاتصال في القائمة المختارة</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : lists.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3">
          <p className="text-sm text-amber-800 font-semibold">لا توجد قوائم إرسال</p>
          <p className="text-xs text-amber-700">أنشئ قائمة جهات اتصال أولاً</p>
          <Link href="/dashboard/contacts" className="inline-block bg-brand-800 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-700">
            إدارة جهات الاتصال
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedId(list.id)}
              className={`w-full text-right rounded-xl border p-4 flex items-center gap-3 transition-all hover:shadow-sm ${selectedId === list.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300" : "border-slate-200 bg-white hover:border-brand-200"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${selectedId === list.id ? "bg-brand-100" : "bg-slate-100"}`}>
                👥
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{list.name}</p>
                {list.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{list.description}</p>}
                <p className="text-xs text-brand-600 font-medium mt-0.5">{list.total_count.toLocaleString("ar")} جهة اتصال</p>
              </div>
              {selectedId === list.id && (
                <div className="w-5 h-5 bg-brand-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/smart-send/letter" className="text-sm text-slate-500 hover:text-slate-700">← العودة</Link>
        <button
          onClick={handleNext}
          disabled={!selectedId}
          className="bg-brand-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          التالي ←
        </button>
      </div>
    </main>
  );
}
