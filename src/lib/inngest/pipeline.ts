import { inngest } from "./client";
import { fetchYouTubeItems } from "@/lib/sources/youtube";
import { fetchRedditItems } from "@/lib/sources/reddit";
import { fetchTwitterItems } from "@/lib/sources/twitter";
import { fetchDocsItems, extractFeatureKeywords } from "@/lib/sources/docs";
import { fetchAndClassifyChangelog } from "@/lib/sources/anthropic-changelog";
import { ingestBatch } from "@/lib/pipeline/ingest";
import { codeDedup } from "@/lib/pipeline/dedup";
import { matchAndUpdateArticles } from "@/lib/pipeline/match-articles";
import { generateFeedPosts } from "@/lib/pipeline/generate-feed-posts";
import { generateDailyBrief, fallbackDailyBrief } from "@/lib/pipeline/generate-daily-brief";
import { notifyPipelineComplete } from "@/lib/pipeline/notify";
import { getPublishedContent, flagArticleForReview, isUrlProcessed, getRecentFeedPosts, upsertDailyBrief } from "@/lib/supabase/queries";
import type { FetchedItem } from "@/types";

/**
 * Main pipeline function — full content pipeline
 *
 * Orchestrated by Inngest with one step per source item so each
 * stays under Vercel Hobby's 10-second function timeout.
 *
 * Flow:
 *   1. Fetch all new YouTube + Reddit + Twitter items (one step each)
 *   2. Extract structured data from each item via Claude (one step per item)
 *   3. Dedup + quality filter the batch (single batch Claude call)
 *   4. Synthesize filtered items into publishable content (single batch Claude call)
 *   5. Send email notification to admin
 */
export const pipelineFunction = inngest.createFunction(
  {
    id: "tipstack-pipeline",
    name: "TipStack Content Pipeline",
    // Scheduling lives in the GitHub Actions daily pipeline
    // (.github/workflows/daily-pipeline.yml). This function is kept only for
    // manual/event invocation via `pipeline/run`; no cron trigger, so it can't
    // double-run the pipeline if the app is deployed.
    triggers: [{ event: "pipeline/run" }],
  },
  async ({ step }) => {
    const batchDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // ── Step 1: Fetch new items from all sources ──────────────────────────

    const docsItems = await step.run("fetch-docs", async () => {
      return fetchDocsItems(isUrlProcessed);
    });

    const _docKeywords = await step.run("extract-doc-keywords", async () => {
      return extractFeatureKeywords(docsItems);
    });

    const youtubeItems = await step.run("fetch-youtube", async () => {
      return fetchYouTubeItems();
    });

    const redditItems = await step.run("fetch-reddit", async () => {
      return fetchRedditItems();
    });

    const twitterItems = await step.run("fetch-twitter", async () => {
      return fetchTwitterItems();
    });

    const changelogResult = await step.run("fetch-changelog", async () => {
      return fetchAndClassifyChangelog();
    });

    const allItems: FetchedItem[] = [...docsItems, ...youtubeItems, ...redditItems, ...twitterItems];

    if (allItems.length === 0) {
      await step.run("notify-empty", async () => {
        await notifyPipelineComplete({
          batchDate,
          itemsFetched: 0,
          itemsKept: 0,
          itemsDiscarded: 0,
          contentPiecesCreated: 0,
        });
      });
      return { status: "no_new_items", batchDate };
    }

    // ── Step 2: Batch extract + ingest (5 items per Claude call, concurrent) ──

    const { ingested, failed } = await step.run("batch-extract", async () => {
      return ingestBatch(allItems, batchDate);
    });

    // ── Step 3: Code-based dedup + quality filter (no Claude call) ────────

    const { kept: keptIds } = await step.run("code-dedup", async () => {
      return codeDedup(batchDate);
    });

    const itemsDiscarded = ingested.length - keptIds.length;

    if (keptIds.length === 0) {
      await step.run("notify-all-filtered", async () => {
        await notifyPipelineComplete({
          batchDate,
          itemsFetched: allItems.length,
          itemsKept: 0,
          itemsDiscarded: itemsDiscarded,
          contentPiecesCreated: 0,
        });
      });
      return {
        status: "all_filtered",
        batchDate,
        itemsFetched: allItems.length,
        itemsDiscarded,
      };
    }

    // ── Step 4: Match & update articles (replaces old synthesize) ───────

    const articleUpdates = await step.run("match-articles", async () => {
      return matchAndUpdateArticles(batchDate);
    });

    // ── Step 5: Staleness detection ─────────────────────────────────────

    const staleArticles = await step.run("detect-staleness", async () => {
      const { detectStaleness } = await import("@/lib/pipeline/match-articles");
      const publishedArticles = await getPublishedContent(100, 0);
      return detectStaleness(docsItems, publishedArticles);
    });

    await step.run("flag-stale-articles", async () => {
      for (const stale of staleArticles) {
        await flagArticleForReview(stale.articleId, stale.reason);
      }
    });

    // ── Step 6: Generate feed posts for each new/updated article ─────────

    const feedPostsCreated = await step.run("generate-feed-posts", async () => {
      return generateFeedPosts(articleUpdates);
    });

    // ── Step 6b: Generate today's daily brief digest ────────────────────

    await step.run("generate-daily-brief", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const recent = await getRecentFeedPosts(1, 100);
      const todays = recent.filter(
        (p) => new Date(p.published_at).toISOString().slice(0, 10) === today
      );
      if (todays.length === 0) return null;

      let brief;
      try {
        brief = await generateDailyBrief(todays);
      } catch {
        brief = fallbackDailyBrief(todays);
      }
      await upsertDailyBrief({
        briefDate: today,
        headline: brief.headline,
        summary: brief.summary,
        storyCount: todays.length,
      });
      return today;
    });

    // ── Step 7: Revalidate caches ───────────────────────────────────────

    await step.run("revalidate-caches", async () => {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      const secret = process.env.REVALIDATION_SECRET;
      if (!secret) return;

      for (const tag of ["feed", "content"]) {
        await fetch(`${baseUrl}/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag, secret }),
        });
      }
    });

    // ── Step 8: Notify admin ──────────────────────────────────────────────

    await step.run("notify-complete", async () => {
      await notifyPipelineComplete({
        batchDate,
        itemsFetched: allItems.length,
        itemsKept: keptIds.length,
        itemsDiscarded,
        contentPiecesCreated: articleUpdates.length,
        feedPostsCreated,
        staleArticlesFlagged: staleArticles.length,
      });
    });

    return {
      status: "completed",
      batchDate,
      itemsFetched: allItems.length,
      itemsKept: keptIds.length,
      itemsDiscarded,
      contentPiecesCreated: articleUpdates.length,
      feedPostsCreated,
      staleArticlesFlagged: staleArticles.length,
      docKeywordsExtracted: _docKeywords.length,
      changelogInserted: changelogResult.inserted,
    };
  }
);
