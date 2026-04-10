"use client";

import { useEffect, useState } from "react";

import { getCurrentUser, hasStoredSession, signOut as clearSession } from "@/lib/auth";
import type { AuthUser } from "@/types";

type UseAuthResult = {
  user: AuthUser | null;
  isLoading: boolean;
  hasSession: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => void;
};


export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  async function refreshUser(): Promise<void> {
    const sessionExists = hasStoredSession();
    setHasSession(sessionExists);

    if (!sessionExists) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
      setHasSession(false);
    } finally {
      setIsLoading(false);
    }
  }

  function signOut(): void {
    clearSession();
    setUser(null);
    setHasSession(false);
  }

  useEffect(() => {
    void refreshUser();
  }, []);

  return {
    user,
    isLoading,
    hasSession,
    refreshUser,
    signOut
  };
}
