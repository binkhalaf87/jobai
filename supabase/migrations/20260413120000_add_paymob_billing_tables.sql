alter type public.subscription_status add value if not exists 'pending_activation';
alter type public.subscription_status add value if not exists 'expired';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_audience') then
    create type public.plan_audience as enum ('jobseeker', 'recruiter');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_kind') then
    create type public.plan_kind as enum ('subscription', 'points_pack');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'billing_interval') then
    create type public.billing_interval as enum ('monthly', 'one_time');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_order_type') then
    create type public.payment_order_type as enum ('subscription_initial', 'subscription_renewal', 'points_purchase');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_order_status') then
    create type public.payment_order_status as enum ('pending', 'payment_key_issued', 'paid', 'failed', 'canceled', 'expired', 'refunded', 'partially_refunded');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_webhook_event_status') then
    create type public.payment_webhook_event_status as enum ('received', 'processed', 'ignored', 'failed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'wallet_transaction_type') then
    create type public.wallet_transaction_type as enum ('subscription_grant', 'points_purchase', 'usage_debit', 'refund_credit', 'adjustment');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'wallet_transaction_status') then
    create type public.wallet_transaction_status as enum ('posted', 'reversed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'wallet_transaction_direction') then
    create type public.wallet_transaction_direction as enum ('credit', 'debit');
  end if;
end
$$;

create table if not exists public.plans (
  id uuid primary key,
  code varchar(100) not null unique,
  name varchar(100) not null,
  audience public.plan_audience not null,
  kind public.plan_kind not null,
  billing_interval public.billing_interval not null,
  currency varchar(3) not null default 'SAR',
  price_amount_minor integer,
  points_grant integer not null default 0,
  is_active boolean not null default true,
  display_order integer not null default 0,
  description text,
  metadata_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists plan_id uuid references public.plans(id) on delete set null;

create table if not exists public.payment_orders (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  order_type public.payment_order_type not null,
  status public.payment_order_status not null default 'pending',
  amount_minor integer not null,
  currency varchar(3) not null default 'SAR',
  provider_name varchar(50) not null default 'paymob',
  provider_order_id varchar(255),
  provider_payment_key varchar(255),
  provider_transaction_id varchar(255) unique,
  merchant_reference varchar(255) not null unique,
  idempotency_key varchar(255) not null unique,
  request_payload jsonb,
  response_payload jsonb,
  failure_reason text,
  paid_at timestamptz,
  expired_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  id uuid primary key,
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  provider_name varchar(50) not null default 'paymob',
  event_type varchar(100) not null,
  provider_event_id varchar(255) unique,
  provider_order_id varchar(255),
  provider_transaction_id varchar(255),
  status public.payment_webhook_event_status not null default 'received',
  signature_valid boolean not null default false,
  retry_count integer not null default 0,
  event_payload jsonb not null,
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_wallets (
  id uuid primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  balance_points integer not null default 0,
  lifetime_earned_points integer not null default 0,
  lifetime_spent_points integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key,
  wallet_id uuid not null references public.user_wallets(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  transaction_type public.wallet_transaction_type not null,
  status public.wallet_transaction_status not null default 'posted',
  direction public.wallet_transaction_direction not null,
  points integer not null,
  balance_before integer not null,
  balance_after integer not null,
  description text,
  source_ref varchar(255),
  event_payload jsonb,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_plans_code on public.plans (code);
create index if not exists ix_plans_audience on public.plans (audience);
create index if not exists ix_plans_kind on public.plans (kind);
create index if not exists ix_subscriptions_plan_id on public.subscriptions (plan_id);

create index if not exists ix_payment_orders_user_id on public.payment_orders (user_id);
create index if not exists ix_payment_orders_plan_id on public.payment_orders (plan_id);
create index if not exists ix_payment_orders_subscription_id on public.payment_orders (subscription_id);
create index if not exists ix_payment_orders_order_type on public.payment_orders (order_type);
create index if not exists ix_payment_orders_status on public.payment_orders (status);
create index if not exists ix_payment_orders_provider_order_id on public.payment_orders (provider_order_id);

create index if not exists ix_payment_webhook_events_payment_order_id on public.payment_webhook_events (payment_order_id);
create index if not exists ix_payment_webhook_events_subscription_id on public.payment_webhook_events (subscription_id);
create index if not exists ix_payment_webhook_events_user_id on public.payment_webhook_events (user_id);
create index if not exists ix_payment_webhook_events_event_type on public.payment_webhook_events (event_type);
create index if not exists ix_payment_webhook_events_provider_order_id on public.payment_webhook_events (provider_order_id);
create index if not exists ix_payment_webhook_events_provider_transaction_id on public.payment_webhook_events (provider_transaction_id);
create index if not exists ix_payment_webhook_events_status on public.payment_webhook_events (status);
create index if not exists ix_payment_webhook_events_received_at on public.payment_webhook_events (received_at);

create index if not exists ix_user_wallets_user_id on public.user_wallets (user_id);

create index if not exists ix_wallet_transactions_wallet_id on public.wallet_transactions (wallet_id);
create index if not exists ix_wallet_transactions_user_id on public.wallet_transactions (user_id);
create index if not exists ix_wallet_transactions_payment_order_id on public.wallet_transactions (payment_order_id);
create index if not exists ix_wallet_transactions_subscription_id on public.wallet_transactions (subscription_id);
create index if not exists ix_wallet_transactions_transaction_type on public.wallet_transactions (transaction_type);
create index if not exists ix_wallet_transactions_status on public.wallet_transactions (status);
create index if not exists ix_wallet_transactions_effective_at on public.wallet_transactions (effective_at);
