-- Run this in Supabase SQL Editor.

create table if not exists projects (
  id text primary key,
  project_title text not null,
  client_name text not null default 'Confidential Client',
  requirement_text text not null,
  status text not null default 'draft',
  proposal_version integer not null default 0,
  estimate_range text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proposal_versions (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  version integer not null,
  title text not null,
  source_type text not null,
  base_versions integer[] not null default '{}',
  is_finalized_snapshot boolean not null default false,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create table if not exists teams_sessions (
  session_id text primary key,
  project_id text not null unique references projects(id) on delete cascade,
  team_name text not null,
  channel_name text not null,
  thread_id text not null,
  status text not null default 'created',
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_updated_at on projects(updated_at desc);
create index if not exists idx_proposal_versions_project on proposal_versions(project_id);

-- Real-time chat messages (no auth, identity via sender_name dropdown)
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references projects(id) on delete cascade,
  sender_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_project
  on chat_messages(project_id, created_at asc);

alter table chat_messages enable row level security;

create policy "Anyone can read messages"
  on chat_messages for select using (true);

create policy "Anyone can send messages"
  on chat_messages for insert with check (true);
