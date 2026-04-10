do $$
begin
  if not exists (select 1 from pg_type where typname = 'resume_processing_status') then
    create type public.resume_processing_status as enum ('uploaded', 'processing', 'parsed', 'failed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'employment_type') then
    create type public.employment_type as enum ('full_time', 'part_time', 'contract', 'internship', 'temporary');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'analysis_status') then
    create type public.analysis_status as enum ('queued', 'processing', 'completed', 'failed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'suggestion_section') then
    create type public.suggestion_section as enum ('summary', 'experience', 'skills', 'education', 'general');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'usage_event_type') then
    create type public.usage_event_type as enum ('analysis_requested', 'analysis_completed', 'rewrite_generated', 'auth_login');
  end if;
end
$$;

create table if not exists public.users (
  id uuid primary key,
  email varchar(320) not null unique,
  full_name varchar(255),
  password_hash varchar(255),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_descriptions (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(255) not null,
  company_name varchar(255),
  source_url varchar(500),
  source_text text not null,
  normalized_text text,
  keyword_data jsonb,
  employment_type public.employment_type,
  location_text varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(255) not null,
  source_filename varchar(255),
  file_type varchar(50),
  storage_key varchar(500),
  raw_text text,
  normalized_text text,
  structured_data jsonb,
  page_count integer,
  processing_status public.resume_processing_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  plan_name varchar(100) not null,
  status public.subscription_status not null default 'trialing',
  provider_name varchar(50) not null default 'stripe',
  provider_customer_id varchar(255),
  provider_subscription_id varchar(255) unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_description_id uuid not null references public.job_descriptions(id) on delete cascade,
  status public.analysis_status not null default 'queued',
  model_name varchar(100),
  overall_score numeric(5,2),
  summary_text text,
  result_payload jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rewrite_suggestions (
  id uuid primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  section public.suggestion_section not null,
  original_text text,
  suggested_text text not null,
  rationale text,
  is_applied boolean not null default false,
  display_order integer not null default 0,
  anchor_label varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  event_type public.usage_event_type not null,
  request_id varchar(100),
  credits_used integer not null default 0,
  detail text,
  event_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ix_users_email on public.users (email);
create index if not exists ix_job_descriptions_user_id on public.job_descriptions (user_id);
create index if not exists ix_resumes_user_id on public.resumes (user_id);
create index if not exists ix_subscriptions_user_id on public.subscriptions (user_id);
create index if not exists ix_subscriptions_provider_customer_id on public.subscriptions (provider_customer_id);
create index if not exists ix_analyses_user_id on public.analyses (user_id);
create index if not exists ix_analyses_resume_id on public.analyses (resume_id);
create index if not exists ix_analyses_job_description_id on public.analyses (job_description_id);
create index if not exists ix_rewrite_suggestions_analysis_id on public.rewrite_suggestions (analysis_id);
create index if not exists ix_usage_logs_user_id on public.usage_logs (user_id);
create index if not exists ix_usage_logs_event_type on public.usage_logs (event_type);
create index if not exists ix_usage_logs_request_id on public.usage_logs (request_id);
create index if not exists ix_usage_logs_created_at on public.usage_logs (created_at);
