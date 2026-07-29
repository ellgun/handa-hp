-- 한다뚝딱 (handa. 뚝딱) — 실 서비스 스키마
-- Supabase 대시보드 > SQL Editor에 붙여넣어 한 번 실행한다.
-- 필드는 DATA_MODEL.md 문서가 아니라 현재 코드(app/input/page.js, /api/generate)가
-- 실제로 쓰는 필드 이름을 기준으로 만들었다. DATA_MODEL.md는 이후 별도로 맞춰야 한다.

create extension if not exists pgcrypto;

-- 1. profiles
-- 이 프로젝트에는 이미 Google 로그인 시 자동으로 채워지는 profiles 표가 있었다
-- (id, email, display_name, avatar_url, provider, created_at, updated_at).
-- 기존 표와 데이터를 그대로 둔 채, 앱에 필요한 컬럼만 추가한다.
create table if not exists profiles (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists role text not null default 'user';
alter table profiles add column if not exists last_login_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table profiles add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

-- 더미 이메일/관리자 테스트 로그인이 auth.users에 없는 고정 UUID를 쓰기 때문에,
-- profiles.id -> auth.users FK가 있으면 제거한다. 더미 로그인을 제거하는 시점에 다시 추가한다.
do $$
declare
  fk record;
begin
  for fk in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'f'
  loop
    execute format('alter table public.profiles drop constraint %I', fk.conname);
  end loop;
end $$;

-- 2. draft_inputs
-- 입력 폼이 3단계(기본 정보/매장 자랑거리/디자인 스타일)로 줄어들면서 contact·sns_url·
-- business_number·benchmark_url·extra_requests는 더 이상 폼에서 수집하지 않는다.
-- 기존 데이터를 보존하기 위해 컬럼은 남기고 NOT NULL만 해제한다.
create table if not exists draft_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  region_industry text not null,
  contact text,
  sns_url text,
  business_number varchar(100),
  main_product_copy varchar(200) not null,
  strengths text not null,
  benchmark_url text,
  color_theme text not null,
  mood text not null,
  extra_requests text,
  email text not null,
  image_names text[],
  created_at timestamptz not null default now()
);

alter table draft_inputs alter column contact drop not null;
alter table draft_inputs alter column extra_requests drop not null;

-- 업체명(store_name)을 region_industry와 분리된 별도 컬럼으로 추가한다.
alter table draft_inputs add column if not exists store_name text;
update draft_inputs set store_name = coalesce(store_name, '') where store_name is null;
alter table draft_inputs alter column store_name set not null;

-- 매장 사진을 실제로 Supabase Storage에 업로드하게 되면서, 파일명이 아니라 공개 URL을 저장한다.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'draft_inputs' and column_name = 'image_names'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'draft_inputs' and column_name = 'image_urls'
  ) then
    alter table draft_inputs rename column image_names to image_urls;
  end if;
end $$;
alter table draft_inputs add column if not exists image_urls text[];

create index if not exists draft_inputs_user_id_idx on draft_inputs(user_id);

-- 3. drafts
create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  input_id uuid not null references draft_inputs(id),
  region_industry text,
  html_content text not null,
  suggestion_summary varchar(1000),
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table drafts add column if not exists store_name text;

create index if not exists drafts_user_id_idx on drafts(user_id);

-- 4. email_delivery_logs
create table if not exists email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  draft_id uuid not null references drafts(id),
  status text not null check (status in ('requested', 'sent', 'failed')),
  http_status int,
  provider_request_id text,
  error_code varchar(100),
  created_at timestamptz not null default now()
);

create index if not exists email_delivery_logs_user_id_idx on email_delivery_logs(user_id);

-- 5. activity_logs
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  event_type text not null,
  page_path text,
  target_type text,
  target_id text,
  status text not null check (status in ('success', 'failed')),
  error_code varchar(100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_id_idx on activity_logs(user_id);

-- 6. Storage — 매장 사진 업로드용 공개 버킷.
-- 업로드는 항상 서버(/api/upload-photos, service role)에서만 하므로 별도 insert 정책은 필요 없다.
-- public 버킷이라 읽기는 RLS와 무관하게 공개 URL로 바로 서빙된다.
insert into storage.buckets (id, name, public)
values ('store-images', 'store-images', true)
on conflict (id) do nothing;

-- RLS
-- 앱은 항상 서버(service role)에서 접근하므로 이 정책이 지금 당장 앱 동작에
-- 영향을 주진 않는다. 다만 DATA_MODEL.md / API_CONTRACT.md / TEST_CHECKLIST.md가
-- 요구하는 "RLS 활성화" 조건을 충족하고, 이후 클라이언트 직접 접근에 대한 안전망이 된다.

alter table profiles enable row level security;
alter table draft_inputs enable row level security;
alter table drafts enable row level security;
alter table email_delivery_logs enable row level security;
alter table activity_logs enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

drop policy if exists "draft_inputs_select_own" on draft_inputs;
create policy "draft_inputs_select_own" on draft_inputs
  for select using (auth.uid() = user_id);

drop policy if exists "draft_inputs_insert_own" on draft_inputs;
create policy "draft_inputs_insert_own" on draft_inputs
  for insert with check (auth.uid() = user_id);

drop policy if exists "drafts_select_own" on drafts;
create policy "drafts_select_own" on drafts
  for select using (auth.uid() = user_id);

drop policy if exists "drafts_insert_own" on drafts;
create policy "drafts_insert_own" on drafts
  for insert with check (auth.uid() = user_id);

drop policy if exists "email_delivery_logs_select_own" on email_delivery_logs;
create policy "email_delivery_logs_select_own" on email_delivery_logs
  for select using (auth.uid() = user_id);

-- activity_logs: 일반 사용자에게 열어주는 조회 정책 없음 (관리자만 서버 service role로 조회)
