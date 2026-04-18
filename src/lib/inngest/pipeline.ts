import { inngest } from "./client";
import { fetchYouTubeItems } from "@/lib/sources/youtube";
import { fetchRedditItems } from "@/lib/sources/reddit";
import { fetchTwitterItems } from "@/lib/sources/twitter";
import { ingestItem } from "@/lib/pipeline/ingest";
import { dedupAndFilter } from "@/lib/pipeline/dedup";
import { synthesize } from "@/lib/pipeline/synthesize";
import { notifyPipelineComplete } from "@/lib/pipeline/notify";
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
    triggers: [{ event: "pipeline/run" }],
  },
  async ({ step }) => {
    const batchDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // ── Step 1: Fetch new items from all sources ──────────────────────────

    const youtubeItems = await step.run("fetch-youtube", async () => {
      return fetchYouTubeItems();
    });

    const redditItems = await step.run("fetch-reddit", async () => {
      return fetchRedditItems();
    });

    const twitterItems = await step.run("fetch-twitter", async () => {
      return fetchTwitterItems();
    });

    const allItems: FetchedItem[] = [...youtubeItems, ...redditItems, ...twitterItems];

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

    // ── Step 2: Extract each item (one Inngest step per item) ─────────────

    const extractResults: { url: string; rawContentId: string }[] = [];

    for (const item of allItems) {
      const rawContentId = await step.run(
        `extract-${item.platform}-${encodeURIComponent(item.url).slice(0, 80)}`,
        async () => {
          return ingestItem(item, batchDate);
        }
      );

      extractResults.push({ url: item.url, rawContentId });
    }

    // ── Step 3: Dedup + quality filter (single batch Claude call) ─────────

    const keptIds = await step.run("dedup-and-filter", async () => {
      return dedupAndFilter(batchDate);
    });

    const itemsDiscarded = extractResults.length - keptIds.length;

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

    // ── Step 4: Synthesize into publishable content ───────────────────────

    const piecesCreated = await step.run("synthesize", async () => {
      return synthesize(batchDate);
    });

    // ── Step 5: Notify admin ──────────────────────────────────────────────

    await step.run("notify-complete", async () => {
      await notifyPipelineComplete({
        batchDate,
        itemsFetched: allItems.length,
        itemsKept: keptIds.length,
        itemsDiscarded,
        contentPiecesCreated: piecesCreated,
      });
    });

    return {
      status: "completed",
      batchDate,
      itemsFetched: allItems.length,
      itemsKept: keptIds.length,
      itemsDiscarded,
      contentPiecesCreated: piecesCreated,
    };
  }
);
