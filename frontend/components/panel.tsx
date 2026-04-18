import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

// This simple surface component provides a consistent card style for starter screens.
export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-brand-900/5 ${className}`.trim()}
    >
      {children}
    </section>
  );
}

