"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/panel";
import { useAuth } from "@/hooks/use-auth";
import {
  createBillingCheckoutIntention,
  getBillingPlans,
  getBillingSnapshot,
  getWalletTransactions,
} from "@/lib/billing";
import type {
  BillingCheckoutPayload,
  BillingMeResponse,
  BillingPlan,
  BillingWalletTransaction,
} from "@/types";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [returnBanner, setReturnBanner] = useState<"success" | "failed" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const isSuccess = params.get("is_success");
    if (success === "true" || isSuccess === "1") {
      setReturnBanner("success");
      const timer = setTimeout(() => void loadBillingState(), 3000);
      return () => clearTimeout(timer);
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
        const walletResponse = await getWalletTransactions(20);
        setTransactions(walletResponse.transactions);
      } else {
        setTransactions([]);
      }
    } catch {
      setError(t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBillingState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { subscriptionPlans, pointsPlans } = useMemo(() => ({
    subscriptionPlans: plans.filter((p) => p.kind === "subscription"),
    pointsPlans: plans.filter((p) => p.kind === "points_pack"),
  }), [plans]);

  async function handlePay() {
    if (!selectedPlan) return;
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      const payload: BillingCheckoutPayload = {
        plan_code: selectedPlan.code,
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
      const response = await createBillingCheckoutIntention(payload);
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
    <div className="space-y-6">
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
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              {audience === "recruiter" ? t("eyebrowRecruiter") : t("eyebrow")}
            </p>
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
            {audience === "jobseeker" && wallet ? (
              <p className="mt-4 text-sm text-slate-600">
                {t("pointsBalanceLabel")} <span className="font-semibold text-slate-950">{wallet.balance_points}</span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void loadBillingState()}
            className="self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {t("refresh")}
          </button>
        </div>
      </Panel>

      {/* Section 2 — Plan selection */}
      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("choosePlan")}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {audience === "recruiter" ? t("plansRecruiterTitle") : t("plansTitle")}
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isSelected = selectedPlan?.id === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedPlan(isSelected ? null : plan);
                  setCheckoutError(null);
                }}
                className={`rounded-[2rem] border p-5 text-left transition ${
                  isSelected
                    ? "border-brand-800 bg-brand-800/5 ring-1 ring-brand-800"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
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
              </button>
            );
          })}
        </div>

        {audience === "jobseeker" && pointsPlans.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("pointsPacks")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pointsPlans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(isSelected ? null : plan);
                      setCheckoutError(null);
                    }}
                    className={`rounded-[2rem] border p-5 text-left transition ${
                      isSelected
                        ? "border-brand-800 bg-brand-800/5 ring-1 ring-brand-800"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
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
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </Panel>

      {/* Section 3 — Checkout (only when plan selected) */}
      {selectedPlan ? (
        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("checkoutEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("checkoutTitle")}</h2>

          {/* Plan summary */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-950">{selectedPlan.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedPlan.kind === "points_pack" ? t("planSummaryOneTime") : t("planSummaryMonthly")}
              </p>
            </div>
            <p className="text-xl font-semibold text-slate-950">
              {formatMoney(selectedPlan.price_amount_minor, selectedPlan.currency)}
            </p>
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-700"
            >
              {t("changePlan")}
            </button>
          </div>

          {/* Contact form */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                  onChange={(e) =>
                    setContact((c) => ({ ...c, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
            ))}
          </div>

          {checkoutError ? (
            <p className="mt-4 text-sm text-rose-600">{checkoutError}</p>
          ) : null}

          <button
            type="button"
            disabled={!contact.phone_number.trim() || checkoutLoading}
            onClick={() => void handlePay()}
            className="mt-6 rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {checkoutLoading ? t("payBtnLoading") : t("payBtn")}
          </button>
          {!contact.phone_number.trim() ? (
            <p className="mt-2 text-xs text-slate-500">{t("phoneRequired")}</p>
          ) : null}
        </Panel>
      ) : null}

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
    </div>
  );
}
