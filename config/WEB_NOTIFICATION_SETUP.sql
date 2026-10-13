begin;
create table if not exists public.web_notification_outbox (
 event_key text primary key,
 channel text not null check(channel in ('email','whatsapp')),
 payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','processing','sent')),
 attempts integer not null default 0, last_error text, provider_id text,
 next_attempt_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), sent_at timestamptz
);
create index if not exists web_notice_pending on public.web_notification_outbox(next_attempt_at) where status='pending';
alter table public.web_notification_outbox enable row level security;
revoke all on public.web_notification_outbox from anon,authenticated;
grant select,insert,update,delete on public.web_notification_outbox to service_role;
commit;
