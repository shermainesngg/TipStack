/**
 * One-off cleanup: merge duplicate published articles that share the same
 * category + (near-)identical title. For each group it keeps the richest
 * article as the survivor, unions every group member's source_urls onto it,
 * reassigns/collapses the group's feed_posts to a single most-recent one, and
 * marks the rest of the articles as `rejected` (reversible — status flip).
 *
 * Conservative: only exact-normalized-title collisions merge (parentheticals
 * stripped), so distinct articles are never combined.
 *
 * Dry-run:  npx tsx scripts/merge-duplicate-articles.ts
 * Apply:    npx tsx scripts/merge-duplicate-articles.ts --apply
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const MIN_TITLE_LEN = 12; // don't group on trivially short/generic titles

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function normTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // drop trailing parentheticals like "(and Keep Them Cheap)"
    .replace(/[^a-z0-9]/g, "");
}

interface Row {
  id: string;
  title: string;
  slug: string;
  tags_category: string;
  source_urls: { url: string }[] | null;
  body: string | null;
  created_at: string;
}

async function main() {
  const { data: content, error } = await sb
    .from("content")
    .select("id, title, slug, tags_category, source_urls, body, created_at")
    .eq("status", "published");
  if (error) throw new Error(error.message);

  const groups = new Map<string, Row[]>();
  for (const c of (content ?? []) as Row[]) {
    const norm = normTitle(c.title);
    if (norm.length < MIN_TITLE_LEN) continue;
    const key = `${c.tags_category}::${norm}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const dupeGroups = [...groups.values()].filter((g) => g.length > 1);
  const totalDupes = dupeGroups.reduce((n, g) => n + g.length - 1, 0);
  console.log(
    `${dupeGroups.length} duplicate groups covering ${dupeGroups.reduce((n, g) => n + g.length, 0)} articles → ${totalDupes} to merge away.\n`
  );

  let mergedArticles = 0;
  let deletedFeedPosts = 0;

  for (const group of dupeGroups) {
    group.sort(
      (a, b) =>
        (b.source_urls?.length ?? 0) - (a.source_urls?.length ?? 0) ||
        (b.body?.length ?? 0) - (a.body?.length ?? 0) ||
        (b.created_at > a.created_at ? 1 : -1)
    );
    const survivor = group[0];
    const dupes = group.slice(1);
    const allIds = group.map((g) => g.id);

    const seen = new Set<string>();
    const unioned: { url: string }[] = [];
    for (const c of group)
      for (const s of c.source_urls ?? []) {
        const k = s.url || JSON.stringify(s);
        if (!seen.has(k)) {
          seen.add(k);
          unioned.push(s);
        }
      }

    const { data: fps } = await sb
      .from("feed_posts")
      .select("id, topic_content_id, published_at")
      .in("topic_content_id", allIds)
      .order("published_at", { ascending: false });
    const keepFp = fps?.[0];
    const dropFps = (fps ?? []).filter((f) => f.id !== keepFp?.id);

    console.log(
      `[${survivor.tags_category}] "${survivor.title.slice(0, 56)}"\n` +
        `  survivor=${survivor.id.slice(0, 8)}(${survivor.source_urls?.length ?? 0}src)  merge ${dupes.length} dupes  ` +
        `sources→${unioned.length}  feedposts ${fps?.length ?? 0}→${keepFp ? 1 : 0} (drop ${dropFps.length})`
    );

    if (!APPLY) continue;

    await sb.from("content").update({ source_urls: unioned }).eq("id", survivor.id);
    if (keepFp && keepFp.topic_content_id !== survivor.id)
      await sb.from("feed_posts").update({ topic_content_id: survivor.id }).eq("id", keepFp.id);
    if (dropFps.length)
      await sb.from("feed_posts").delete().in("id", dropFps.map((f) => f.id));
    await sb
      .from("content")
      .update({ status: "rejected", review_reason: `Merged duplicate of ${survivor.slug}` })
      .in("id", dupes.map((d) => d.id));

    mergedArticles += dupes.length;
    deletedFeedPosts += dropFps.length;
  }

  console.log(
    `\n${APPLY ? "APPLIED" : "DRY RUN — re-run with --apply to commit"}: ` +
      `${dupeGroups.length} survivors, ${totalDupes} dupes ${APPLY ? "rejected" : "would be rejected"}` +
      (APPLY ? `; ${deletedFeedPosts} redundant feed posts deleted.` : ".")
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
