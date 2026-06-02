import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Panel({ children, className = "", id }: PanelProps) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-brand-900/5 ${className}`.trim()}
    >
      {children}
    </section>
  );
}

