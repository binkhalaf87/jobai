"use client";

import { useEffect, useState } from "react";

import { getCurrentUser, signOut as clearSession } from "@/lib/auth";
import type { AuthUser } from "@/types";

type UseAuthResult = {
  user: AuthUser | null;
  isLoading: boolean;
  hasSession: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};


export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  async function refreshUser(): Promise<void> {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setHasSession(currentUser !== null);
    } catch {
      setUser(null);
      setHasSession(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    await clearSession();
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
    signOut,
  };
}
