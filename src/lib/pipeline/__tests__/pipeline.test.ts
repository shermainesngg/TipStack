import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FetchedItem } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockFetchYouTubeItems = vi.fn();
const mockFetchRedditItems = vi.fn();
const mockFetchTwitterItems = vi.fn();
const mockFetchDocsItems = vi.fn();
const mockExtractFeatureKeywords = vi.fn();
vi.mock("@/lib/sources/youtube", () => ({
  fetchYouTubeItems: () => mockFetchYouTubeItems(),
}));
vi.mock("@/lib/sources/reddit", () => ({
  fetchRedditItems: () => mockFetchRedditItems(),
}));
vi.mock("@/lib/sources/twitter", () => ({
  fetchTwitterItems: () => mockFetchTwitterItems(),
}));
vi.mock("@/lib/sources/docs", () => ({
  fetchDocsItems: () => mockFetchDocsItems(),
  extractFeatureKeywords: (...args: unknown[]) => mockExtractFeatureKeywords(...args),
}));

const mockIngestBatch = vi.fn();
vi.mock("@/lib/pipeline/ingest", () => ({
  ingestBatch: (...args: unknown[]) => mockIngestBatch(...args),
}));

const mockCodeDedup = vi.fn();
vi.mock("@/lib/pipeline/dedup", () => ({
  codeDedup: (...args: unknown[]) => mockCodeDedup(...args),
}));

const mockMatchAndUpdateArticles = vi.fn();
const mockDetectStaleness = vi.fn();
vi.mock("@/lib/pipeline/match-articles", () => ({
  matchAndUpdateArticles: (...args: unknown[]) => mockMatchAndUpdateArticles(...args),
  detectStaleness: (...args: unknown[]) => mockDetectStaleness(...args),
}));

const mockGenerateFeedPosts = vi.fn();
vi.mock("@/lib/pipeline/generate-feed-posts", () => ({
  generateFeedPosts: (...args: unknown[]) => mockGenerateFeedPosts(...args),
}));

const mockNotify = vi.fn();
vi.mock("@/lib/pipeline/notify", () => ({
  notifyPipelineComplete: (...args: unknown[]) => mockNotify(...args),
}));

const mockGetPublishedContent = vi.fn();
const mockFlagArticleForReview = vi.fn();
vi.mock("@/lib/supabase/queries", () => ({
  getPublishedContent: (...args: unknown[]) => mockGetPublishedContent(...args),
  flagArticleForReview: (...args: unknown[]) => mockFlagArticleForReview(...args),
}));

// Mock Inngest — capture the function handler so we can call it directly
let capturedHandler: (ctx: { step: typeof mockStep }) => Promise<unknown>;

const mockStep = {
  run: vi.fn((_name: string, fn: () => Promise<unknown>) => fn()),
};

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    createFunction: (
      _config: unknown,
      handler: (ctx: { step: typeof mockStep }) => Promise<unknown>
    ) => {
      capturedHandler = handler;
      return handler;
    },
  },
}));

// Import after mocks are set up
await import("@/lib/inngest/pipeline");

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchedItem(
  id: string,
  platform: "youtube" | "reddit" = "youtube"
): FetchedItem {
  return {
    url: `https://example.com/${id}`,
    platform,
    content: `Content for ${id}`,
    creator: "Test Creator",
    title: `Title ${id}`,
  };
}

function setupDefaultMocks() {
  mockFetchDocsItems.mockResolvedValue([]);
  mockExtractFeatureKeywords.mockReturnValue([]);
  mockFetchTwitterItems.mockResolvedValue([]);
  mockGetPublishedContent.mockResolvedValue([]);
  mockDetectStaleness.mockReturnValue([]);
  mockGenerateFeedPosts.mockResolvedValue(0);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("pipeline function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStep.run.mockImplementation(
      (_name: string, fn: () => Promise<unknown>) => fn()
    );
    setupDefaultMocks();
  });

  it("returns no_new_items and notifies when no sources have new content", async () => {
    mockFetchYouTubeItems.mockResolvedValue([]);
    mockFetchRedditItems.mockResolvedValue([]);

    const result = await capturedHandler({ step: mockStep });

    expect(result).toMatchObject({ status: "no_new_items" });
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        itemsFetched: 0,
        contentPiecesCreated: 0,
      })
    );
    expect(mockIngestBatch).not.toHaveBeenCalled();
    expect(mockCodeDedup).not.toHaveBeenCalled();
  });

  it("runs full pipeline: fetch → batch extract → dedup → match → notify", async () => {
    mockFetchYouTubeItems.mockResolvedValue([makeFetchedItem("yt1")]);
    mockFetchRedditItems.mockResolvedValue([makeFetchedItem("rd1", "reddit")]);
    mockIngestBatch.mockResolvedValue({ ingested: ["raw-1", "raw-2"], failed: [] });
    mockCodeDedup.mockResolvedValue({ kept: ["raw-1"], discarded: ["raw-2"] });
    mockMatchAndUpdateArticles.mockResolvedValue([
      { contentId: "c1", isNew: true, sourcePlatforms: ["youtube"], sourceUrls: [] },
    ]);
    mockGenerateFeedPosts.mockResolvedValue(1);

    const result = await capturedHandler({ step: mockStep });

    expect(mockIngestBatch).toHaveBeenCalledTimes(1);
    expect(mockCodeDedup).toHaveBeenCalledTimes(1);
    expect(mockMatchAndUpdateArticles).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledTimes(1);

    expect(result).toMatchObject({
      status: "completed",
      itemsFetched: 2,
      itemsKept: 1,
      contentPiecesCreated: 1,
    });
  });

  it("skips synthesis and notifies when all items are filtered out", async () => {
    mockFetchYouTubeItems.mockResolvedValue([makeFetchedItem("yt1")]);
    mockFetchRedditItems.mockResolvedValue([]);
    mockIngestBatch.mockResolvedValue({ ingested: ["raw-1"], failed: [] });
    mockCodeDedup.mockResolvedValue({ kept: [], discarded: ["raw-1"] });

    const result = await capturedHandler({ step: mockStep });

    expect(mockMatchAndUpdateArticles).not.toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        itemsFetched: 1,
        itemsKept: 0,
        itemsDiscarded: 1,
        contentPiecesCreated: 0,
      })
    );
    expect(result).toMatchObject({ status: "all_filtered" });
  });
});
