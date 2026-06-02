import { api } from "@/lib/api";
import type {
  BillingCheckoutPayload,
  BillingCheckoutResponse,
  BillingMeResponse,
  BillingPlansResponse,
  BillingWalletTransactionsResponse,
  CartCheckoutPayload,
  CartCheckoutResponse,
} from "@/types";

export async function getBillingPlans(): Promise<BillingPlansResponse> {
  return api.get<BillingPlansResponse>("/billing/plans");
}

export async function getBillingSnapshot(): Promise<BillingMeResponse> {
  return api.get<BillingMeResponse>("/billing/me");
}

export async function createBillingCheckoutIntention(payload: BillingCheckoutPayload): Promise<BillingCheckoutResponse> {
  return api.post<BillingCheckoutResponse>("/billing/checkout/intention", payload);
}

export async function getWalletTransactions(limit = 20): Promise<BillingWalletTransactionsResponse> {
  return api.get<BillingWalletTransactionsResponse>(`/billing/wallet/transactions?limit=${limit}`);
}

export async function getFeatureCredits(): Promise<Record<string, number>> {
  return api.get<Record<string, number>>("/billing/feature-credits");
}

export async function createCartCheckoutIntention(payload: CartCheckoutPayload): Promise<CartCheckoutResponse> {
  return api.post<CartCheckoutResponse>("/billing/cart/checkout", payload);
}

export async function verifyPayment(params: {
  paymentOrderId?: string;
  merchantReference?: string;
  paymobTransactionId?: string;
}): Promise<{ status: string; activated: boolean }> {
  return api.post<{ status: string; activated: boolean }>("/billing/verify-payment", {
    payment_order_id: params.paymentOrderId,
    merchant_reference: params.merchantReference,
    paymob_transaction_id: params.paymobTransactionId,
  });
}
