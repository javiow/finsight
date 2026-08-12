-- PostHog 에러 트래킹 웹훅(단건+급증 alert)의 멱등 저장소.
-- 사용자 데이터가 아니라 운영 이벤트이므로 RLS는 켜두되 정책은 두지 않는다 —
-- service-role만 접근 가능하고 anon/authenticated에는 아무 권한도 주지 않는다.
create table public.oncall_alert_events (
  event_id text primary key,
  alert_kind text not null check (alert_kind in ('issue', 'spike')),
  dispatch_status text not null default 'pending' check (dispatch_status in ('pending', 'dispatched')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.oncall_alert_events enable row level security;

revoke all on public.oncall_alert_events from authenticated, anon;
