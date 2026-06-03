/**
 * Repair a feed post that points to a broad host article by regenerating a
 * focused standalone article from the post's OWN source material, then
 * repointing the card to it.
 *
 * Why this exists: when an incoming item was merged into a broad living article
 * (e.g. a "Claude Code vs X" comparison), the feed post's headline describes the
 * narrow new topic but links to the sprawling host. The narrow topic has no
 * standalone article to repoint to — it must be created. See match-articles.ts
 * `findMatchingArticle` (now category-gated) for the forward-looking fix.
 *
 * Usage:
 *   npx tsx scripts/repair-feed-post-article.ts <feed_post_id> [--dry]
 */
import "./lib/shim-server-only";

import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { createServiceClient } from "@/lib/supabase/server";
import { createNewArticle } from "@/lib/pipeline/match-articles";
import { getArticleUrl } from "@/lib/categories";
import type { RawContent } from "@/types";

async function main() {
  const feedPostId = process.argv.find((a) => /^[0-9a-f-]{36}$/.test(a));
  const dry = process.argv.includes("--dry");
  if (!feedPostId) {
    console.error("Provide a feed_post id (uuid) as an argument.");
    process.exit(1);
  }

  const sb = createServiceClient();

  const { data: post, error: postErr } = await sb
    .from("feed_posts")
    .select("id, headline, topic_content_id, source_urls, published_at")
    .eq("id", feedPostId)
    .single();
  if (postErr || !post) throw new Error(`Feed post not found: ${postErr?.message}`);

  const { data: oldArticle } = await sb
    .from("content")
    .select("title, tags_category")
    .eq("id", post.topic_content_id)
    .maybeSingle();

  console.log(`Feed post:  "${post.headline}"`);
  console.log(`Currently → [${oldArticle?.tags_category}] ${oldArticle?.title}\n`);

  const urls = (post.source_urls as { url: string }[]).map((s) => s.url);
  const { data: rawRows, error: rawErr } = await sb
    .from("raw_content")
    .select("*")
    .in("source_url", urls);
  if (rawErr) throw new Error(`Failed to load raw_content: ${rawErr.message}`);
  if (!rawRows || rawRows.length === 0) {
    throw new Error(`No raw_content rows match this post's source URLs: ${urls.join(", ")}`);
  }

  const items = rawRows as RawContent[];
  console.log(`Source material (${items.length} item(s)):`);
  for (const r of items) {
    console.log(`  - [${r.raw_extract.tags_category}] ${r.raw_extract.title}`);
  }

  if (dry) {
    console.log("\n--dry: stopping before any writes.");
    return;
  }

  // Reuse the real synthesis primitive so slug/sub-topic/schema all match the pipeline.
  const batchDate = items[0].batch_date ?? post.published_at.slice(0, 10);
  const newId = await createNewArticle(items, batchDate);

  // createNewArticle inserts as pending_review; publish it so the card resolves,
  // and backdate published_at to the card's date to preserve feed chronology.
  const { data: published, error: pubErr } = await sb
    .from("content")
    .update({ status: "published", published_at: post.published_at })
    .eq("id", newId)
    .select("title, slug, tags_category")
    .single();
  if (pubErr || !published) throw new Error(`Failed to publish new article: ${pubErr?.message}`);

  // Repoint the card.
  const { error: repointErr } = await sb
    .from("feed_posts")
    .update({ topic_content_id: newId })
    .eq("id", post.id);
  if (repointErr) throw new Error(`Failed to repoint feed post: ${repointErr.message}`);

  console.log(`\nNew article → [${published.tags_category}] ${published.title}`);
  console.log(`Card now links to: ${getArticleUrl(published.tags_category, published.slug)}`);
  console.log(`(content id ${newId})`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
