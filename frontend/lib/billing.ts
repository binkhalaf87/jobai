import { api } from "@/lib/api";
import type {
  BillingCheckoutPayload,
  BillingCheckoutResponse,
  BillingMeResponse,
  BillingPlansResponse,
  BillingWalletTransactionsResponse,
} from "@/types";

export async function getBillingPlans(): Promise<BillingPlansResponse> {
  return api.get<BillingPlansResponse>("/billing/plans", { auth: true });
}

export async function getBillingSnapshot(): Promise<BillingMeResponse> {
  return api.get<BillingMeResponse>("/billing/me", { auth: true });
}

export async function createBillingCheckoutIntention(payload: BillingCheckoutPayload): Promise<BillingCheckoutResponse> {
  return api.post<BillingCheckoutResponse>("/billing/checkout/intention", payload, { auth: true });
}

export async function getWalletTransactions(limit = 20): Promise<BillingWalletTransactionsResponse> {
  return api.get<BillingWalletTransactionsResponse>(`/billing/wallet/transactions?limit=${limit}`, { auth: true });
}
