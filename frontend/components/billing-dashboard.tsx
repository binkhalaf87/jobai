"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/panel";
import { useAuth } from "@/hooks/use-auth";
import {
  createCartCheckoutIntention,
  getBillingPlans,
  getBillingSnapshot,
  getFeatureCredits,
  getWalletTransactions,
  verifyAllPending,
  verifyPayment,
} from "@/lib/billing";
import type {
  BillingMeResponse,
  BillingPlan,
  BillingWalletTransaction,
  CartCheckoutPayload,
} from "@/types";

type CartItem = { plan: BillingPlan; quantity: number };

function getPlanName(plan: BillingPlan, t: (key: string) => string): string {
  const c = plan.code.toLowerCase();
  if (c.includes("resume_analysis")) return t("plans.resumeAnalysis");
  if (c.includes("resume_improvement")) return t("plans.resumeImprovement");
  if (c.includes("mock_interview")) return t("plans.mockInterview");
  if (c.includes("smart_send_3000")) return t("plans.smartSend3000");
  if (c.includes("smart_send_1500")) return t("plans.smartSend1500");
  if (c.includes("smart_send_500")) return t("plans.smartSend500");
  return plan.name;
}

const DEFAULT_CONTACT = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  city: "Riyadh",
  country: "SA",
};

function formatMoney(amountMinor: number | null | undefined, currency: string): string {
  if (!amountMinor || amountMinor <= 0) return `0 ${currency}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildCheckoutUrl(publicKey: string, clientSecret: string): string {
  return `https://ksa.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;
}

const STATUS_KEY_MAP: Record<string, string> = {
  active: "active",
  canceled: "canceled",
  cancelled: "canceled",
  expired: "expired",
  pending: "pending",
  paid: "paid",
  failed: "failed",
  payment_key_issued: "payment_key_issued",
};

function resolveStatusKey(status: string): string {
  return STATUS_KEY_MAP[status.toLowerCase().replace(/\s+/g, "_")] ?? "unknown";
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const key = resolveStatusKey(status);
  const colorClass =
    key === "active" || key === "paid"
      ? "bg-teal-light/30 text-teal"
      : key === "pending" || key === "payment_key_issued" || key === "unknown"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-50 text-rose-600";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
      {t(`status.${key}`)}
    </span>
  );
}

export function BillingDashboard({ audience }: { audience: "jobseeker" | "recruiter" }) {
  const { user } = useAuth();
  const t = useTranslations("billing");

  const [snapshot, setSnapshot] = useState<BillingMeResponse | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [transactions, setTransactions] = useState<BillingWalletTransaction[]>([]);
  const [featureCredits, setFeatureCredits] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyBanner, setVerifyBanner] = useState<"activated" | "none" | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [returnBanner, setReturnBanner] = useState<"success" | "failed" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const isSuccess = params.get("is_success");
    const paymobTxId = params.get("id") ?? undefined;

    // Capture ALL redirect params to send for HMAC-based local verification.
    // Paymob KSA includes all 20 HMAC fields + ?hmac=... in the callback URL.
    const redirectParams: Record<string, string> = {};
    params.forEach((val, key) => { if (val) redirectParams[key] = val; });

    if (success === "true" || isSuccess === "1") {
      setReturnBanner("success");
      const paymentOrderId = localStorage.getItem("pending_payment_order_id") ?? undefined;
      const merchantReference = localStorage.getItem("pending_merchant_reference") ?? undefined;
      localStorage.removeItem("pending_payment_order_id");
      localStorage.removeItem("pending_merchant_reference");

      const hasRedirectHmac = Boolean(redirectParams["hmac"]);
      if (paymentOrderId || merchantReference || paymobTxId || hasRedirectHmac) {
        // Send redirect params for HMAC verification (bypasses broken Paymob list API).
        // Fall back to verify-all-pending if this fails.
        void verifyPayment({
          paymentOrderId,
          merchantReference,
          paymobTransactionId: paymobTxId,
          redirectParams: hasRedirectHmac ? redirectParams : undefined,
        })
          .catch(() => verifyAllPending().catch(() => null))
          .finally(() => void loadBillingState());
      } else {
        // No identifiers available — poll verify-all-pending after a short delay.
        const timer = setTimeout(() => {
          void verifyAllPending().catch(() => null).finally(() => void loadBillingState());
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else if (success === "false" || isSuccess === "0") {
      setReturnBanner("failed");
    }
    params.delete("success");
    params.delete("is_success");
    params.delete("txn_response_code");
    params.delete("id");
    const newSearch = params.toString();
    window.history.replaceState(null, "", newSearch ? `?${newSearch}` : window.location.pathname);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.email) {
      const [first_name, ...rest] = (user.full_name ?? "").trim().split(/\s+/).filter(Boolean);
      setContact((c) => ({
        ...c,
        email: c.email || user.email,
        first_name: c.first_name || first_name || "",
        last_name: c.last_name || rest.join(" ") || "",
      }));
    }
  }, [user]);

  async function loadBillingState() {
    try {
      setIsLoading(true);
      setError(null);
      const [plansResponse, snapshotResponse] = await Promise.all([getBillingPlans(), getBillingSnapshot()]);
      setPlans(plansResponse.plans);
      setSnapshot(snapshotResponse);
      if (snapshotResponse.role === "jobseeker") {
        const [walletResponse, creditsResponse] = await Promise.all([
          getWalletTransactions(20),
          getFeatureCredits().catch(() => ({})),
        ]);
        setTransactions(walletResponse.transactions);
        setFeatureCredits(creditsResponse);
      } else {
        setTransactions([]);
      }
    } catch {
      setError(t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshAndVerify() {
    setIsVerifying(true);
    setVerifyBanner(null);
    try {
      const result = await verifyAllPending();
      // Log diagnostic details to browser console for debugging
      console.log("[JobAI] verify-all-pending result:", result);
      await loadBillingState();
      setVerifyBanner(result.activated > 0 ? "activated" : "none");
    } catch (err) {
      console.error("[JobAI] verify-all-pending error:", err);
      await loadBillingState();
      setVerifyBanner("none");
    } finally {
      setIsVerifying(false);
    }
  }

  useEffect(() => {
    void loadBillingState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { subscriptionPlans, pointsPlans, featurePlans, smartSendPlans } = useMemo(() => {
    const featureCodes = ["resume_analysis", "resume_improvement", "mock_interview_10sar"];
    const smartSendCodes = ["smart_send_500", "smart_send_1500", "smart_send_3000"];
    return {
      subscriptionPlans: audience === "jobseeker" ? [] : plans.filter((p) => p.kind === "subscription"),
      pointsPlans: plans.filter((p) => p.kind === "points_pack" &&
        !featureCodes.some((c) => p.code.includes(c)) &&
        !smartSendCodes.some((c) => p.code.includes(c))
      ),
      featurePlans: plans.filter((p) => p.kind === "points_pack" && (
        p.code.includes("resume_analysis") ||
        p.code.includes("resume_improvement") ||
        p.code.includes("mock_interview")
      )),
      smartSendPlans: plans.filter((p) => p.kind === "points_pack" && p.code.includes("smart_send")),
    };
  }, [plans, audience]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.plan.price_amount_minor ?? 0) * item.quantity, 0);
  const cartCurrency = cart[0]?.plan.currency ?? "SAR";
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(plan: BillingPlan) {
    setCart((c) => {
      const existing = c.find((item) => item.plan.id === plan.id);
      if (existing) {
        return c.map((item) => item.plan.id === plan.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...c, { plan, quantity: 1 }];
    });
    setCheckoutError(null);
  }

  function removeFromCart(planId: string) {
    setCart((c) => c.filter((item) => item.plan.id !== planId));
  }

  function updateQuantity(planId: string, delta: number) {
    setCart((c) =>
      c
        .map((item) => item.plan.id === planId ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0)
    );
  }

  function isInCart(planId: string) {
    return cart.some((item) => item.plan.id === planId);
  }

  function cartQuantity(planId: string) {
    return cart.find((item) => item.plan.id === planId)?.quantity ?? 0;
  }

  async function handlePay() {
    if (cart.length === 0) return;
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      const payload: CartCheckoutPayload = {
        items: cart.map((item) => ({ plan_code: item.plan.code, quantity: item.quantity })),
        billing_data: {
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone_number: contact.phone_number,
          city: contact.city,
          country: contact.country,
          apartment: "NA",
          floor: "NA",
          street: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          state: "NA",
        },
      };
      const response = await createCartCheckoutIntention(payload);
      localStorage.setItem("pending_payment_order_id", response.payment_order_id);
      localStorage.setItem("pending_merchant_reference", response.merchant_reference);
      window.location.href = buildCheckoutUrl(
        response.checkout.public_key,
        response.checkout.client_secret,
      );
    } catch {
      setCheckoutError(t("payError"));
      setCheckoutLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          {audience === "recruiter" ? t("eyebrowRecruiter") : t("eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{t("loading")}</h1>
      </Panel>
    );
  }

  if (error || !snapshot) {
    return (
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          {audience === "recruiter" ? t("eyebrowRecruiter") : t("eyebrow")}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{error ?? t("loadError")}</h1>
        <button
          type="button"
          onClick={() => void loadBillingState()}
          className="mt-6 rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {t("retry")}
        </button>
      </Panel>
    );
  }

  const currentPlanId = snapshot.current_subscription?.plan_id ?? null;
  const wallet = snapshot.wallet;
  const sub = snapshot.current_subscription;

  return (
    <div className={`space-y-6 ${cart.length > 0 ? "pb-28" : ""}`}>
      {/* Return banner */}
      {returnBanner === "success" ? (
        <div className="rounded-2xl bg-teal-light/30 px-6 py-4 text-sm font-semibold text-teal">
          {t("paymentSuccess")}
        </div>
      ) : returnBanner === "failed" ? (
        <div className="rounded-2xl bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-600">
          {t("paymentFailed")}
        </div>
      ) : null}

      {/* Section 1 — Current plan */}
      <Panel className="p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              {audience === "recruiter" ? t("eyebrowRecruiter") : t("eyebrow")}
            </p>

            {audience === "jobseeker" ? (
              <>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  {t("balanceTitle")}
                </h1>
                {wallet ? (
                  <p className="mt-3 text-sm text-slate-600">
                    {t("pointsBalanceLabel")} <span className="font-semibold text-slate-950">{wallet.balance_points}</span>
                  </p>
                ) : null}
                {Object.keys(featureCredits).some((k) => featureCredits[k] > 0) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      { key: "resume_analysis", label: t("store.credits.resumeAnalysis") },
                      { key: "resume_improvement", label: t("store.credits.resumeImprovement") },
                      { key: "mock_interview", label: t("store.credits.mockInterview") },
                      { key: "smart_send_contacts", label: t("store.credits.smartSend") },
                    ].map(({ key, label }) => {
                      const balance = featureCredits[key] ?? 0;
                      if (balance === 0) return null;
                      return (
                        <div key={key} className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
                          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">{label}</p>
                          <p className="mt-1 text-2xl font-bold text-teal-900">{balance}</p>
                          <p className="text-xs text-teal-600">{key === "smart_send_contacts" ? t("store.credits.smartSendUnit") : t("store.credits.usageUnit")}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {sub && resolveStatusKey(sub.status) === "active" ? (
                  <p className="mt-4 text-sm text-slate-500">{t("subscriptionActiveNote")}</p>
                ) : null}
              </>
            ) : (
              <>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  {sub?.plan_name ?? t("noActivePlan")}
                </h1>
                {sub ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StatusBadge status={sub.status} t={t} />
                    <span className="text-sm text-slate-500">
                      {formatDate(sub.current_period_start)} – {formatDate(sub.current_period_end)}
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">{t("choosePlanHint")}</p>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => void refreshAndVerify()}
            disabled={isVerifying}
            className="self-start rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isVerifying ? t("verifying") : t("refresh")}
          </button>
        </div>
        {verifyBanner === "activated" && (
          <div className="mt-4 rounded-2xl bg-teal-50 px-5 py-3 text-sm font-medium text-teal-800">
            {t("verifyActivated")}
          </div>
        )}
        {verifyBanner === "none" && (
          <div className="mt-4 rounded-2xl bg-slate-50 px-5 py-3 text-sm text-slate-600">
            {t("verifyNoPending")}
            {snapshot.recent_orders.some((o) => o.status === "payment_key_issued" || o.status === "pending") && (
              <p className="mt-1 text-xs text-amber-700">
                {t("verifyPendingHint")}
              </p>
            )}
          </div>
        )}
      </Panel>

      {/* Section 2 — Store (feature plans + smart send) */}
      {audience === "jobseeker" && (featurePlans.length > 0 || smartSendPlans.length > 0) && (
        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("store.balanceEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("store.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("store.subtitle")}</p>

          {/* Feature credit balances */}
          {Object.keys(featureCredits).some((k) => featureCredits[k] > 0) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { key: "resume_analysis", label: t("store.credits.resumeAnalysis") },
                { key: "resume_improvement", label: t("store.credits.resumeImprovement") },
                { key: "mock_interview", label: t("store.credits.mockInterview") },
                { key: "smart_send_contacts", label: t("store.credits.smartSend") },
              ].map(({ key, label }) => {
                const balance = featureCredits[key] ?? 0;
                if (balance === 0) return null;
                return (
                  <div key={key} className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-teal-900">{balance}</p>
                    <p className="text-xs text-teal-600">{key === "smart_send_contacts" ? t("store.credits.smartSendUnit") : t("store.credits.usageUnit")}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feature purchase cards */}
          {featurePlans.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-600 mb-3">{t("store.oneTimeServices")}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {featurePlans.map((plan) => {
                  const inCart = isInCart(plan.id);
                  const qty = cartQuantity(plan.id);
                  const icon = plan.code.includes("analysis") ? "📊" : plan.code.includes("improvement") ? "✍️" : "🎤";
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-5 text-right transition ${
                        inCart
                          ? "border-brand-800 bg-brand-800/5 ring-1 ring-brand-800"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="text-2xl mb-2">{icon}</div>
                      <h3 className="text-base font-semibold text-slate-900">{getPlanName(plan, t)}</h3>
                      <p className="mt-3 text-2xl font-bold text-brand-800">
                        {formatMoney(plan.price_amount_minor, plan.currency)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{t("store.oneTimeSingleUse")}</p>
                      {inCart ? (
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(plan.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center font-semibold text-slate-900">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(plan.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-800 text-brand-800 hover:bg-brand-50"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(plan.id)}
                            className="text-xs text-rose-500 underline underline-offset-2 hover:text-rose-700"
                          >
                            {t("store.remove")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(plan)}
                          className="mt-4 w-full rounded-full border border-brand-800 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-800 hover:text-white"
                        >
                          {t("store.addToCart")}
                        </button>
                      )}
                    </div>
                  );
                })}
                {/* Job search - free */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-right">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="text-base font-semibold text-slate-900">{t("store.jobSearch")}</h3>
                  <p className="mt-3 text-2xl font-bold text-emerald-700">{t("store.free")}</p>
                  <p className="text-xs text-emerald-600 mt-1">{t("store.freeForAll")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Smart send packages */}
          {smartSendPlans.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-600 mb-3">{t("store.smartSendPackages")}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {smartSendPlans.map((plan, idx) => {
                  const inCart = isInCart(plan.id);
                  const badges = ["", t("store.mostPopular"), t("store.bestValue")];
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-5 text-right transition ${
                        inCart
                          ? "border-brand-800 bg-brand-800/5 ring-1 ring-brand-800"
                          : idx === 1
                            ? "border-brand-300 bg-brand-50"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      {badges[idx] && (
                        <span className="absolute -top-2 right-4 rounded-full bg-brand-800 px-2.5 py-0.5 text-xs font-semibold text-white">
                          {badges[idx]}
                        </span>
                      )}
                      <h3 className="text-base font-semibold text-slate-900">{getPlanName(plan, t)}</h3>
                      <p className="mt-3 text-2xl font-bold text-brand-800">
                        {formatMoney(plan.price_amount_minor, plan.currency)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{t("store.oneTime")}</p>
                      {inCart ? (
                        <button
                          type="button"
                          onClick={() => removeFromCart(plan.id)}
                          className="mt-4 w-full rounded-full bg-brand-800 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                        >
                          {t("store.inCartRemove")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(plan)}
                          className="mt-4 w-full rounded-full border border-brand-800 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-800 hover:text-white"
                        >
                          {t("store.addToCart")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Section 3 — Subscription plans (recruiter + legacy) */}
      {(subscriptionPlans.length > 0 || (audience === "jobseeker" && pointsPlans.length > 0 && featurePlans.length === 0)) && (
      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("choosePlan")}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {audience === "recruiter" ? t("plansRecruiterTitle") : t("plansTitle")}
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const inCart = isInCart(plan.id);
            return (
              <div
                key={plan.id}
                className={`rounded-[2rem] border p-5 transition ${
                  inCart
                    ? "border-brand-800 bg-brand-800/5 ring-1 ring-brand-800"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">{plan.name}</h3>
                  {isCurrent ? (
                    <span className="inline-flex rounded-full bg-teal-light/30 px-2.5 py-0.5 text-xs font-semibold text-teal">
                      {t("currentBadge")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {plan.description ?? t("billedMonthly")}
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMoney(plan.price_amount_minor, plan.currency)}
                  <span className="ml-1 text-sm font-normal text-slate-500">{t("perMonth")}</span>
                </p>
                {plan.points_grant > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {t("includesPoints", { count: plan.points_grant })}
                  </p>
                ) : null}
                {inCart ? (
                  <button
                    type="button"
                    onClick={() => removeFromCart(plan.id)}
                    className="mt-4 w-full rounded-full bg-brand-800 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {t("store.inCartRemove")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(plan)}
                    className="mt-4 w-full rounded-full border border-brand-800 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-800 hover:text-white"
                  >
                    {t("store.addToCart")}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {audience === "jobseeker" && pointsPlans.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("pointsPacks")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pointsPlans.map((plan) => {
                const inCart = isInCart(plan.id);
                return (
                  <div
                    key={plan.id}
                    className={`rounded-[2rem] border p-5 transition ${
                      inCart
                        ? "border-brand-800 bg-brand-800/5 ring-1 ring-brand-800"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <h3 className="text-lg font-semibold tracking-tight text-slate-950">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {plan.description ?? t("oneTimePurchaseDesc", { count: plan.points_grant })}
                    </p>
                    <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                      {formatMoney(plan.price_amount_minor, plan.currency)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("includesPoints", { count: plan.points_grant })}
                    </p>
                    {inCart ? (
                      <button
                        type="button"
                        onClick={() => removeFromCart(plan.id)}
                        className="mt-4 w-full rounded-full bg-brand-800 py-2 text-sm font-semibold text-white"
                      >
                        {t("store.inCartRemove")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(plan)}
                        className="mt-4 w-full rounded-full border border-brand-800 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-800 hover:text-white"
                      >
                        {t("store.addToCart")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Panel>
      )}

      {/* Section 4 — Cart & Checkout */}
      {cart.length > 0 && (
        <Panel id="cart-section" className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("store.cartEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("store.cartTitle")}</h2>

          {/* Cart items */}
          <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
            {cart.map((item) => (
              <div key={item.plan.id} className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{item.plan.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatMoney(item.plan.price_amount_minor, item.plan.currency)} × {item.quantity}
                  </p>
                </div>
                {item.plan.kind === "points_pack" && (
                  item.plan.code.includes("resume") || item.plan.code.includes("mock_interview")
                ) ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.plan.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                    >
                      −
                    </button>
                    <span className="min-w-[1.5rem] text-center font-semibold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.plan.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-800 text-brand-800 hover:bg-brand-50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="shrink-0 text-sm font-semibold text-slate-700">×{item.quantity}</span>
                )}
                <p className="shrink-0 text-sm font-semibold text-slate-950 min-w-[5rem] text-left">
                  {formatMoney((item.plan.price_amount_minor ?? 0) * item.quantity, item.plan.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.plan.id)}
                  className="shrink-0 text-slate-400 hover:text-rose-500 transition"
                  aria-label={t("store.remove")}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
            <p className="font-semibold text-slate-700">{t("store.total")}</p>
            <p className="text-2xl font-bold text-brand-800">{formatMoney(cartTotal, cartCurrency)}</p>
          </div>

          {/* Contact form */}
          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">{t("checkoutEyebrow")}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  { key: "email", labelKey: "form.email", placeholder: "email@example.com" },
                  { key: "phone_number", labelKey: "form.phone", placeholder: "+9665xxxxxxxx" },
                  { key: "first_name", labelKey: "form.firstName", placeholder: "" },
                  { key: "last_name", labelKey: "form.lastName", placeholder: "" },
                  { key: "city", labelKey: "form.city", placeholder: "Riyadh" },
                  { key: "country", labelKey: "form.country", placeholder: "SA" },
                ] as const
              ).map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t(field.labelKey)}
                  </span>
                  <input
                    value={contact[field.key as keyof typeof contact]}
                    onChange={(e) => setContact((c) => ({ ...c, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>
              ))}
            </div>
          </div>

          {checkoutError ? (
            <p className="mt-4 text-sm text-rose-600">{checkoutError}</p>
          ) : null}

          <button
            type="button"
            disabled={!contact.phone_number.trim() || checkoutLoading}
            onClick={() => void handlePay()}
            className="mt-6 rounded-full bg-brand-800 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {checkoutLoading ? t("payBtnLoading") : `${t("payBtn")} — ${formatMoney(cartTotal, cartCurrency)}`}
          </button>
          {!contact.phone_number.trim() ? (
            <p className="mt-2 text-xs text-slate-500">{t("phoneRequired")}</p>
          ) : null}
        </Panel>
      )}

      {/* Recent orders */}
      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("historyEyebrow")}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("historyTitle")}</h2>
        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200">
          {snapshot.recent_orders.length === 0 ? (
            <div className="bg-slate-50 p-6 text-sm text-slate-600">{t("noOrders")}</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {snapshot.recent_orders.map((order) => (
                <div key={order.id} className="grid gap-3 bg-white p-5 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr] md:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{order.plan_name || order.plan_code}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(order.created_at)}</p>
                  </div>
                  <p className="text-sm text-slate-600">{formatMoney(order.amount_minor, order.currency)}</p>
                  <StatusBadge status={order.status} t={t} />
                  <p className="text-sm text-slate-600">
                    {order.paid_at ? formatDate(order.paid_at) : t("awaitingPayment")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* Wallet ledger (jobseekers only) */}
      {audience === "jobseeker" ? (
        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("walletEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("walletTitle")}</h2>
          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200">
            {transactions.length === 0 ? (
              <div className="bg-slate-50 p-6 text-sm text-slate-600">{t("noTransactions")}</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {transactions.map((tx) => (
                  <div key={tx.id} className="grid gap-2 bg-white p-5 md:grid-cols-[1.2fr_0.7fr_0.7fr] md:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{tx.description ?? tx.transaction_type.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(tx.effective_at)}</p>
                    </div>
                    <p className={`text-sm font-semibold ${tx.direction === "credit" ? "text-teal" : "text-rose-600"}`}>
                      {tx.direction === "credit" ? "+" : "-"}{tx.points} pts
                    </p>
                    <p className="text-sm text-slate-600">{t("balanceLabel")} {tx.balance_after}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      ) : null}

      {/* Sticky cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            {/* Cart summary */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-white text-xl">
                🛒
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 leading-none mb-0.5">
                  {cartCount === 1 ? t("store.oneService") : t("store.manyServices", { count: cartCount })}
                </p>
                <p className="text-lg font-bold text-slate-950 leading-none">
                  {formatMoney(cartTotal, cartCurrency)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {checkoutError && (
                <p className="hidden text-xs text-rose-600 md:block">{checkoutError}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  document.getElementById("cart-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="hidden rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:block"
              >
                {t("store.viewCart")}
              </button>
              <button
                type="button"
                disabled={!contact.phone_number.trim() || checkoutLoading}
                onClick={() => void handlePay()}
                className="rounded-full bg-brand-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {checkoutLoading ? t("store.preparing") : t("store.completePayment")}
              </button>
            </div>
          </div>
          {!contact.phone_number.trim() && (
            <p className="pb-2 text-center text-xs text-slate-500">{t("phoneRequired")}</p>
          )}
        </div>
      )}
    </div>
  );
}
