-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  timezone text default 'UTC',
  email_digest_enabled boolean default true,
  email_digest_time time default '07:00:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- DATA SOURCES (connector configuration)
-- ============================================
create type source_type as enum (
  'hackernews',
  'reddit',
  'github_trending',
  'rss',
  'product_hunt'
);

create type connector_status as enum (
  'active',
  'inactive',
  'error',
  'rate_limited'
);

create table public.data_sources (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  source_type source_type not null,
  config jsonb default '{}'::jsonb,
  status connector_status default 'active',
  last_fetch_at timestamp with time zone,
  last_error text,
  rate_limit_reset_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- RAW ITEMS (fetched from sources)
-- ============================================
create table public.raw_items (
  id uuid default uuid_generate_v4() primary key,
  source_id uuid references public.data_sources on delete cascade not null,
  external_id text not null,
  title text not null,
  url text,
  content text,
  author text,
  score integer default 0,
  comments_count integer default 0,
  published_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_id, external_id)
);

-- Index for efficient querying
create index raw_items_source_id_idx on public.raw_items(source_id);
create index raw_items_fetched_at_idx on public.raw_items(fetched_at);
create index raw_items_published_at_idx on public.raw_items(published_at);

-- ============================================
-- TRENDS (aggregated and scored)
-- ============================================
create table public.trends (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  summary text,
  why_it_matters text,
  source_urls text[] default '{}',
  signals jsonb default '{}'::jsonb,

  -- Scoring components
  velocity_score numeric(5,2) default 0,
  cross_platform_score numeric(5,2) default 0,
  relevance_score numeric(5,2) default 0,
  novelty_score numeric(5,2) default 0,
  total_score numeric(5,2) default 0,

  -- Metadata
  source_count integer default 0,
  raw_item_ids uuid[] default '{}',
  trend_date date not null,
  rank integer,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index trends_trend_date_idx on public.trends(trend_date);
create index trends_total_score_idx on public.trends(total_score desc);
create index trends_slug_idx on public.trends(slug);

-- ============================================
-- VOICE PROFILES
-- ============================================
create type platform_type as enum (
  'linkedin',
  'twitter',
  'instagram'
);

create table public.voice_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  platform platform_type not null,
  sample_posts text[] not null,

  -- Extracted patterns
  tone text,
  structure_patterns jsonb default '{}'::jsonb,
  emoji_usage text,
  common_phrases text[] default '{}',
  cta_style text,
  average_length integer,

  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.voice_profiles enable row level security;

-- Voice profiles policies
create policy "Users can view own voice profiles" on public.voice_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert own voice profiles" on public.voice_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own voice profiles" on public.voice_profiles
  for update using (auth.uid() = user_id);

create policy "Users can delete own voice profiles" on public.voice_profiles
  for delete using (auth.uid() = user_id);

-- Index
create index voice_profiles_user_id_idx on public.voice_profiles(user_id);

-- ============================================
-- GENERATED CONTENT
-- ============================================
create type content_type as enum (
  'linkedin_post',
  'twitter_thread',
  'instagram_reel_script',
  'reply'
);

create type content_angle as enum (
  'hot_take',
  'tutorial',
  'founder_story',
  'meme',
  'explainer'
);

create table public.generated_content (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  trend_id uuid references public.trends on delete cascade not null,
  voice_profile_id uuid references public.voice_profiles on delete set null,

  content_type content_type not null,
  angle content_angle,
  content text not null,
  metadata jsonb default '{}'::jsonb,

  is_favorite boolean default false,
  copied_at timestamp with time zone,
  exported_at timestamp with time zone,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.generated_content enable row level security;

-- Generated content policies
create policy "Users can view own generated content" on public.generated_content
  for select using (auth.uid() = user_id);

create policy "Users can insert own generated content" on public.generated_content
  for insert with check (auth.uid() = user_id);

create policy "Users can update own generated content" on public.generated_content
  for update using (auth.uid() = user_id);

create policy "Users can delete own generated content" on public.generated_content
  for delete using (auth.uid() = user_id);

-- Indexes
create index generated_content_user_id_idx on public.generated_content(user_id);
create index generated_content_trend_id_idx on public.generated_content(trend_id);

-- ============================================
-- JOB LOGS (for scheduled tasks)
-- ============================================
create type job_type as enum (
  'fetch_sources',
  'score_trends',
  'send_digest'
);

create type job_status as enum (
  'running',
  'completed',
  'failed'
);

create table public.job_logs (
  id uuid default uuid_generate_v4() primary key,
  job_type job_type not null,
  status job_status not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  duration_ms integer,
  items_processed integer default 0,
  error_message text,
  metadata jsonb default '{}'::jsonb
);

-- Index
create index job_logs_job_type_idx on public.job_logs(job_type);
create index job_logs_started_at_idx on public.job_logs(started_at desc);

-- ============================================
-- USER EXPORTS
-- ============================================
create type export_type as enum (
  'csv',
  'notion',
  'email'
);

create table public.exports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  export_type export_type not null,
  trend_date date not null,
  file_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.exports enable row level security;

-- Exports policies
create policy "Users can view own exports" on public.exports
  for select using (auth.uid() = user_id);

create policy "Users can insert own exports" on public.exports
  for insert with check (auth.uid() = user_id);

-- Index
create index exports_user_id_idx on public.exports(user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_data_sources_updated_at
  before update on public.data_sources
  for each row execute procedure public.handle_updated_at();

create trigger handle_trends_updated_at
  before update on public.trends
  for each row execute procedure public.handle_updated_at();

create trigger handle_voice_profiles_updated_at
  before update on public.voice_profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_generated_content_updated_at
  before update on public.generated_content
  for each row execute procedure public.handle_updated_at();
