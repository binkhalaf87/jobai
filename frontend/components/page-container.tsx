import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

// This shared wrapper keeps page content aligned consistently across routes.
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`.trim()}>{children}</div>;
}

