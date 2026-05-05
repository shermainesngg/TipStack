-- Feed posts: immutable point-in-time snapshots of what's new
create table feed_posts (
  id                uuid primary key default gen_random_uuid(),
  headline          text not null,
  summary           text not null,
  source_urls       jsonb not null default '[]',
  topic_content_id  uuid not null references content(id),
  source_platforms  text[] not null default '{}',
  pipeline_run_id   uuid,
  published_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index idx_feed_posts_published on feed_posts (published_at desc);
create index idx_feed_posts_topic on feed_posts (topic_content_id);

alter table feed_posts enable row level security;
create policy "anon_read" on feed_posts for select using (true);
create policy "service_write" on feed_posts for all to service_role
  using (true) with check (true);
