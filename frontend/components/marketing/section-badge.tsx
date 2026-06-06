export function SectionBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-600">
      {children}
    </span>
  );
}
