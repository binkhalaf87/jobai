"use client";

import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/panel";
import { PaymobCheckoutButton } from "@/components/paymob-checkout-button";
import { useAuth } from "@/hooks/use-auth";
import {
  createBillingCheckoutIntention,
  getBillingPlans,
  getBillingSnapshot,
  getWalletTransactions,
} from "@/lib/billing";
import type {
  BillingCheckoutPayload,
  BillingCheckoutResponse,
  BillingMeResponse,
  BillingPlan,
  BillingWalletTransaction,
} from "@/types";

const DEFAULT_CONTACT = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  apartment: "",
  floor: "",
  street: "",
  building: "",
  shipping_method: "",
  postal_code: "",
  city: "Riyadh",
  country: "SA",
  state: "Riyadh",
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

function getSubscriptionPlans(plans: BillingPlan[]): BillingPlan[] {
  return plans.filter((plan) => plan.kind === "subscription");
}

function getPointsPlans(plans: BillingPlan[]): BillingPlan[] {
  return plans.filter((plan) => plan.kind === "points_pack");
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Panel className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>
    </Panel>
  );
}

function PlanBadge({ current, label }: { current: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        current ? "bg-teal-light/30 text-teal" : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

export function BillingDashboard({ audience }: { audience: "jobseeker" | "recruiter" }) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<BillingMeResponse | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [transactions, setTransactions] = useState<BillingWalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pendingPlanCode, setPendingPlanCode] = useState<string | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<BillingCheckoutResponse | null>(null);
  const [contact, setContact] = useState(DEFAULT_CONTACT);

  useEffect(() => {
    if (user?.email) {
      const [first_name, ...rest] = (user.full_name ?? "").trim().split(/\s+/).filter(Boolean);
      setContact((current) => ({
        ...current,
        email: current.email || user.email,
        first_name: current.first_name || first_name || "",
        last_name: current.last_name || rest.join(" ") || "",
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
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load billing data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBillingState();
  }, []);

  const filteredPlans = useMemo(() => ({
    subscriptionPlans: getSubscriptionPlans(plans),
    pointsPlans: getPointsPlans(plans),
  }), [plans]);

  async function startCheckout(planCode: string) {
    try {
      setCheckoutError(null);
      setPendingPlanCode(planCode);
      setCheckoutSession(null);
      const payload: BillingCheckoutPayload = {
        plan_code: planCode,
        billing_data: contact,
      };
      const response = await createBillingCheckoutIntention(payload);
      setCheckoutSession(response);
      await loadBillingState();
    } catch (checkoutIssue) {
      setCheckoutError(checkoutIssue instanceof Error ? checkoutIssue.message : "Unable to start checkout.");
    } finally {
      setPendingPlanCode(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Panel className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Billing</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Loading billing…</h1>
        </Panel>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Billing</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{error ?? "Unable to load billing."}</h1>
        <button
          type="button"
          onClick={() => void loadBillingState()}
          className="mt-6 rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Retry
        </button>
      </Panel>
    );
  }

  const currentPlanId = snapshot.current_subscription?.plan_id ?? null;
  const wallet = snapshot.wallet;

  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          {audience === "recruiter" ? "Recruiter Billing" : "Billing"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {audience === "recruiter"
            ? "Manage recruiter plans"
            : "Manage plan and checkout"}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          {audience === "recruiter"
            ? "Pick a plan and activate it with Paymob."
            : "Keep your plan active and top up points when needed."}
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Current status"
          value={snapshot.current_subscription?.status.replace(/_/g, " ") ?? "No active subscription"}
          note={snapshot.current_subscription?.plan_name ?? "Choose a plan to start checkout."}
        />
        <MetricCard
          label="Current period"
          value={snapshot.current_subscription?.current_period_end ? formatDate(snapshot.current_subscription.current_period_end) : "—"}
          note="Shown from your latest synced subscription."
        />
        <MetricCard
          label={audience === "jobseeker" ? "Points balance" : "Recent payments"}
          value={audience === "jobseeker" ? String(wallet?.balance_points ?? 0) : String(snapshot.recent_orders.length)}
          note={audience === "jobseeker" ? "Points available for AI actions." : "Recent orders from this account."}
        />
      </div>

      <Panel className="p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Checkout</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Billing details</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Add contact details before creating checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBillingState()}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Email", key: "email", placeholder: user?.email ?? "email@example.com", required: false },
            { label: "First name", key: "first_name", placeholder: "Majid", required: false },
            { label: "Last name", key: "last_name", placeholder: "Alharbi", required: false },
            { label: "Phone number", key: "phone_number", placeholder: "+9665xxxxxxxx", required: true },
          ].map((field) => (
            <label key={field.key} className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {field.label}{field.required ? " *" : ""}
              </span>
              <input
                value={contact[field.key as keyof typeof contact]}
                onChange={(event) =>
                  setContact((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>
          ))}
        </div>
        {checkoutError ? <p className="mt-4 text-sm text-rose-600">{checkoutError}</p> : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Plans</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {audience === "recruiter" ? "Recruiter plans" : "Plans and top-ups"}
          </h2>

          <div className="mt-6 space-y-4">
            {filteredPlans.subscriptionPlans.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              return (
                <div key={plan.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">{plan.name}</h3>
                        <PlanBadge current={isCurrent} label={isCurrent ? "Current plan" : "Available"} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description ?? "Paymob-powered monthly subscription plan."}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-2xl font-semibold tracking-tight text-slate-950">{formatMoney(plan.price_amount_minor, plan.currency)}</p>
                      <p className="mt-1 text-sm text-slate-500">Billed monthly</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!contact.phone_number.trim() || pendingPlanCode === plan.code}
                      onClick={() => void startCheckout(plan.code)}
                      className="rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {pendingPlanCode === plan.code ? "Creating checkout…" : isCurrent ? "Renew / change with Paymob" : "Choose with Paymob"}
                    </button>
                    {plan.points_grant > 0 ? (
                      <span className="text-sm text-slate-500">Includes {plan.points_grant} points on activation.</span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {audience === "jobseeker" && filteredPlans.pointsPlans.length > 0 ? (
              <div className="pt-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Points packs</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {filteredPlans.pointsPlans.map((plan) => (
                    <div key={plan.id} className="rounded-[2rem] border border-slate-200 bg-white p-5">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description ?? `${plan.points_grant} extra points purchased once.`}</p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold tracking-tight text-slate-950">{formatMoney(plan.price_amount_minor, plan.currency)}</p>
                          <p className="mt-1 text-sm text-slate-500">{plan.points_grant} points</p>
                        </div>
                        <button
                          type="button"
                          disabled={!contact.phone_number.trim() || pendingPlanCode === plan.code}
                          onClick={() => void startCheckout(plan.code)}
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {pendingPlanCode === plan.code ? "Creating…" : "Buy via Paymob"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Secure checkout</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Paymob session</h2>

          {checkoutSession ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-teal-light bg-teal-light/20 p-4 text-sm text-teal">
                Payment intention created for <span className="font-semibold">{checkoutSession.plan.name}</span>. Complete it below using Paymob.
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order summary</p>
                <div className="mt-3 grid gap-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3"><span>Plan</span><span className="font-semibold">{checkoutSession.plan.name}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Amount</span><span className="font-semibold">{formatMoney(checkoutSession.amount_minor, checkoutSession.currency)}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Reference</span><span className="font-mono text-xs">{checkoutSession.merchant_reference}</span></div>
                </div>
              </div>
              <PaymobCheckoutButton
                publicKey={checkoutSession.checkout.public_key}
                clientSecret={checkoutSession.checkout.client_secret}
              />
              <p className="text-xs leading-6 text-slate-500">
                Subscription status and wallet balance will update after the Paymob webhook confirms the payment.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-900">No active checkout session</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Pick a plan to load checkout.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recent payment orders</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recent billing</h2>
          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200">
            {snapshot.recent_orders.length === 0 ? (
              <div className="bg-slate-50 p-6 text-sm text-slate-600">No payment orders yet.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {snapshot.recent_orders.map((order) => (
                  <div key={order.id} className="grid gap-3 bg-white p-5 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr] md:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{order.plan_name || order.plan_code}</p>
                      <p className="mt-1 text-xs text-slate-500">Created {formatDate(order.created_at)}</p>
                    </div>
                    <p className="text-sm text-slate-600">{formatMoney(order.amount_minor, order.currency)}</p>
                    <p className="text-sm font-medium capitalize text-slate-700">{order.status.replace(/_/g, " ")}</p>
                    <p className="text-sm text-slate-600">{order.paid_at ? `Paid ${formatDate(order.paid_at)}` : order.failure_reason ?? "Awaiting payment"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {audience === "jobseeker" ? (
          <Panel className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Wallet ledger</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Point transactions</h2>
            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200">
              {transactions.length === 0 ? (
                <div className="bg-slate-50 p-6 text-sm text-slate-600">No wallet transactions yet.</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="grid gap-2 bg-white p-5 md:grid-cols-[1.2fr_0.7fr_0.7fr] md:items-center">
                      <div>
                        <p className="font-semibold text-slate-950">{transaction.description ?? transaction.transaction_type.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(transaction.effective_at)}</p>
                      </div>
                      <p className={`text-sm font-semibold ${transaction.direction === "credit" ? "text-teal" : "text-rose-600"}`}>
                        {transaction.direction === "credit" ? "+" : "-"}{transaction.points} pts
                      </p>
                      <p className="text-sm text-slate-600">Balance: {transaction.balance_after}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        ) : (
          <Panel className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Plan notes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recruiter plan guidance</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                Starter is best for light usage.
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                Growth suits higher hiring volume.
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                Pro fits daily recruiter workflows.
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
