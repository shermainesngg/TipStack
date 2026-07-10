-- Daily briefs: an AI-written digest of a single day's feed activity.
-- One row per calendar day; shown at the top of that day's edition on /.
create table if not exists daily_briefs (
  brief_date   date primary key,
  headline     text not null,
  summary      text not null,
  story_count  int not null default 0,
  generated_at timestamptz not null default now()
);

create index if not exists idx_daily_briefs_date on daily_briefs (brief_date desc);

alter table daily_briefs enable row level security;
create policy "anon_read" on daily_briefs for select using (true);
create policy "service_write" on daily_briefs for all to service_role
  using (true) with check (true);
