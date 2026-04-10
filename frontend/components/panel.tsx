import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

// This simple surface component provides a consistent card style for starter screens.
export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/60 ${className}`.trim()}
    >
      {children}
    </section>
  );
}

