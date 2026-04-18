import { Panel } from "@/components/panel";

const SETTINGS_SECTIONS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "الملف الشخصي",
    description: "تفاصيل الحساب الأساسية والمعلومات الشخصية.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "الأمان",
    description: "كلمة المرور وإعدادات الوصول وسجل الجلسات.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "الإشعارات",
    description: "تنبيهات البريد الإلكتروني والتحديثات الخاصة بالمنتج.",
  },
];

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-800/8 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-teal/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">الإعدادات</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">إعدادات مساحة العمل</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              أدر إعدادات حسابك ومساحة العمل بسهولة.
            </p>
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              {section.icon}
            </div>
            <p className="text-sm font-bold text-slate-900">{section.title}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">{section.description}</p>
          </div>
        ))}
      </div>

      {/* Coming soon panel */}
      <Panel className="p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">قريباً</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">جاهز للنماذج المستقبلية</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">الملف الشخصي</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">التفاصيل الرئيسية تظهر هنا.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">مساحة العمل</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">السمة والسلوك الافتراضي يظهران هنا.</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
