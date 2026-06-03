"use client";

import { useState, useEffect } from "react";
import { getFeatureCredits } from "@/lib/billing";

const SAR_PER_CONTACT = 100 / 500;

export function useBalance() {
  const [balanceSar, setBalanceSar] = useState<number | null>(null);

  useEffect(() => {
    getFeatureCredits()
      .then((c) => setBalanceSar(Math.round((c["smart_send_contacts"] ?? 0) * SAR_PER_CONTACT)))
      .catch(() => setBalanceSar(0));
  }, []);

  return { balanceSar, isLoading: balanceSar === null };
}
