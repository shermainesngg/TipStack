-- Add priority score to feed posts for surfacing top news per day
alter table feed_posts add column priority smallint not null default 5;

create index idx_feed_posts_priority on feed_posts (published_at desc, priority desc);
