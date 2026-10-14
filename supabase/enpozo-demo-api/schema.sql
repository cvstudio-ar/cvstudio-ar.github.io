alter table public.enpozo_demo_collaborators add column if not exists role text not null default 'editor' check (role in ('owner','editor','demo'));
alter table public.enpozo_demo_projects add column if not exists deleted_at timestamptz;
alter table public.enpozo_demo_projects add column if not exists assigned_user uuid;
alter table public.enpozo_demo_projects add column if not exists demo_account_id uuid references public.enpozo_demo_collaborators(id) on delete cascade;
create index if not exists enpozo_demo_scope_idx on public.enpozo_demo_projects(demo_account_id,assigned_user,deleted_at);
alter table public.enpozo_demo_projects enable row level security;
alter table public.enpozo_demo_collaborators enable row level security;
alter table public.enpozo_demo_collaborator_sessions enable row level security;
alter table public.enpozo_demo_settings enable row level security;
