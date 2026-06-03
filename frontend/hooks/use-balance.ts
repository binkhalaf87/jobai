"use client";

import { useState, useEffect } from "react";
import { getFeatureCredits } from "@/lib/billing";

export type FeatureCredits = {
  resume_analysis: number;
  resume_improvement: number;
  mock_interview: number;
  smart_send_contacts: number;
};

export function useBalance() {
  const [credits, setCredits] = useState<FeatureCredits | null>(null);

  useEffect(() => {
    getFeatureCredits()
      .then((c) =>
        setCredits({
          resume_analysis: c["resume_analysis"] ?? 0,
          resume_improvement: c["resume_improvement"] ?? 0,
          mock_interview: c["mock_interview"] ?? 0,
          smart_send_contacts: c["smart_send_contacts"] ?? 0,
        })
      )
      .catch(() =>
        setCredits({ resume_analysis: 0, resume_improvement: 0, mock_interview: 0, smart_send_contacts: 0 })
      );
  }, []);

  return { credits, isLoading: credits === null };
}
