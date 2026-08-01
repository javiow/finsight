create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  polar_customer_id text,
  modified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  status text not null check (status in ('parsing', 'classifying', 'ready', 'failed')),
  row_count int,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.statements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null,
  merchant_name text not null,
  amount numeric not null,
  category text check (
    category in (
      '식비',
      '생활·마트',
      '쇼핑',
      '주거·관리비',
      '카페·간식',
      '교통',
      '문화·여가',
      '교육',
      '통신',
      '여행·숙박',
      '의료·건강',
      '기타'
    )
  ),
  created_at timestamptz not null default now()
);

create table public.user_merchant_categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_name text not null,
  category text not null check (
    category in (
      '식비',
      '생활·마트',
      '쇼핑',
      '주거·관리비',
      '카페·간식',
      '교통',
      '문화·여가',
      '교육',
      '통신',
      '여행·숙박',
      '의료·건강',
      '기타'
    )
  ),
  source text not null check (source in ('ai', 'user')),
  updated_at timestamptz not null default now(),
  primary key (user_id, merchant_name)
);

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,
  category text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.statements enable row level security;
alter table public.transactions enable row level security;
alter table public.user_merchant_categories enable row level security;
alter table public.insights enable row level security;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Users can view their own statements"
  on public.statements
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can view their own transactions"
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can view their own merchant categories"
  on public.user_merchant_categories
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can view their own insights"
  on public.insights
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.profiles to authenticated;
grant select on public.statements to authenticated;
grant select on public.transactions to authenticated;
grant select on public.user_merchant_categories to authenticated;
grant select on public.insights to authenticated;

revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.statements from authenticated;
revoke insert, update, delete on public.transactions from authenticated;
revoke insert, update, delete on public.user_merchant_categories from authenticated;
revoke insert, update, delete on public.insights from authenticated;
