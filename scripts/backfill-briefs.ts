/**
 * One-off backfill so the multi-day briefing navigator has ~a week of editions:
 *   1. Insert feed_posts for published content that never got one, dated to the
 *      content's own day (so it renders on the right edition).
 *   2. Generate + upsert an AI "daily brief" digest for each recent day.
 *
 * Idempotent: skips content that already has a feed post; briefs are upserted.
 * Run: npx tsx scripts/backfill-briefs.ts
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { generateDailyBrief, fallbackDailyBrief } from "@/lib/pipeline/generate-daily-brief";
import type { FeedPost, SourceUrl } from "@/types";

// Wide enough to capture the recent editions even when runs were sparse; the
// navigator caps at the 7 most-recent days that actually have a brief.
const WINDOW_DAYS = 16;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

async function backfillFeedPosts() {
  const floor = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

  const { data: content, error } = await supabase
    .from("content")
    .select("id, title, summary, source_urls, published_at, created_at")
    .eq("status", "published")
    .gte("created_at", floor);
  if (error) throw new Error(`content fetch: ${error.message}`);

  const { data: existing } = await supabase
    .from("feed_posts")
    .select("topic_content_id");
  const covered = new Set((existing ?? []).map((r) => r.topic_content_id));

  const rows: Record<string, unknown>[] = [];
  for (const c of content ?? []) {
    if (covered.has(c.id)) continue;
    const sourceUrls = (c.source_urls ?? []) as SourceUrl[];
    const platforms = [...new Set(sourceUrls.map((s) => s.platform))];
    const when = c.published_at ?? c.created_at;
    rows.push({
      headline: c.title,
      summary: c.summary,
      priority: Math.min(9, 4 + sourceUrls.length),
      source_urls: sourceUrls,
      topic_content_id: c.id,
      source_platforms: platforms.length ? platforms : ["news"],
      published_at: when,
      created_at: when,
    });
  }

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("feed_posts").insert(rows);
    if (insErr) throw new Error(`feed_posts insert: ${insErr.message}`);
  }
  console.log(`Backfilled ${rows.length} feed posts (of ${content?.length ?? 0} content in window).`);
}

async function generateBriefs() {
  // Probe the table so we don't burn model calls if migration 024 isn't applied.
  const probe = await supabase.from("daily_briefs").select("brief_date").limit(1);
  if (probe.error) {
    console.log(
      `⚠ daily_briefs not available (${probe.error.message}). Apply migration 024 and re-run to generate AI briefs. Skipping.`
    );
    return;
  }

  const floor = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

  const { data: posts, error } = await supabase
    .from("feed_posts")
    .select("id, headline, summary, priority, published_at, source_platforms, source_urls")
    .gte("published_at", floor)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`feed_posts fetch: ${error.message}`);

  const byDay = new Map<string, FeedPost[]>();
  for (const p of posts ?? []) {
    const k = dayKey(p.published_at);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(p as unknown as FeedPost);
  }

  for (const [date, dayPosts] of byDay) {
    dayPosts.sort((a, b) => (b.priority ?? 5) - (a.priority ?? 5));
    let brief;
    try {
      brief = await generateDailyBrief(dayPosts);
      console.log(`  ${date}: "${brief.headline}"`);
    } catch (e) {
      brief = fallbackDailyBrief(dayPosts);
      console.log(`  ${date}: (fallback) ${e instanceof Error ? e.message : e}`);
    }
    const { error: upErr } = await supabase.from("daily_briefs").upsert(
      {
        brief_date: date,
        headline: brief.headline,
        summary: brief.summary,
        story_count: dayPosts.length,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "brief_date" }
    );
    if (upErr) throw new Error(`brief upsert ${date}: ${upErr.message}`);
  }
  console.log(`Generated briefs for ${byDay.size} days.`);
}

async function main() {
  console.log("→ Backfilling feed posts...");
  await backfillFeedPosts();
  console.log("→ Generating daily briefs...");
  await generateBriefs();
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
