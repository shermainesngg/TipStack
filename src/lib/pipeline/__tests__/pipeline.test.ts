import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FetchedItem } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockFetchYouTubeItems = vi.fn();
const mockFetchRedditItems = vi.fn();
vi.mock("@/lib/sources/youtube", () => ({
  fetchYouTubeItems: () => mockFetchYouTubeItems(),
}));
vi.mock("@/lib/sources/reddit", () => ({
  fetchRedditItems: () => mockFetchRedditItems(),
}));

const mockIngestItem = vi.fn();
vi.mock("@/lib/pipeline/ingest", () => ({
  ingestItem: (...args: unknown[]) => mockIngestItem(...args),
}));

const mockDedupAndFilter = vi.fn();
vi.mock("@/lib/pipeline/dedup", () => ({
  dedupAndFilter: (...args: unknown[]) => mockDedupAndFilter(...args),
}));

const mockSynthesize = vi.fn();
vi.mock("@/lib/pipeline/synthesize", () => ({
  synthesize: (...args: unknown[]) => mockSynthesize(...args),
}));

const mockNotify = vi.fn();
vi.mock("@/lib/pipeline/notify", () => ({
  notifyPipelineComplete: (...args: unknown[]) => mockNotify(...args),
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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("pipeline function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStep.run.mockImplementation(
      (_name: string, fn: () => Promise<unknown>) => fn()
    );
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
    expect(mockIngestItem).not.toHaveBeenCalled();
    expect(mockDedupAndFilter).not.toHaveBeenCalled();
    expect(mockSynthesize).not.toHaveBeenCalled();
  });

  it("runs full pipeline: fetch → extract → dedup → synthesize → notify", async () => {
    mockFetchYouTubeItems.mockResolvedValue([makeFetchedItem("yt1")]);
    mockFetchRedditItems.mockResolvedValue([makeFetchedItem("rd1", "reddit")]);
    mockIngestItem.mockResolvedValue("raw-id-1");
    mockDedupAndFilter.mockResolvedValue(["raw-id-1"]);
    mockSynthesize.mockResolvedValue(1);

    const result = await capturedHandler({ step: mockStep });

    // Verify all stages ran
    expect(mockIngestItem).toHaveBeenCalledTimes(2);
    expect(mockDedupAndFilter).toHaveBeenCalledTimes(1);
    expect(mockSynthesize).toHaveBeenCalledTimes(1);
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
    mockIngestItem.mockResolvedValue("raw-id-1");
    mockDedupAndFilter.mockResolvedValue([]); // all discarded

    const result = await capturedHandler({ step: mockStep });

    expect(mockSynthesize).not.toHaveBeenCalled();
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

  it("passes correct batch date to all stages", async () => {
    mockFetchYouTubeItems.mockResolvedValue([makeFetchedItem("yt1")]);
    mockFetchRedditItems.mockResolvedValue([]);
    mockIngestItem.mockResolvedValue("raw-id-1");
    mockDedupAndFilter.mockResolvedValue(["raw-id-1"]);
    mockSynthesize.mockResolvedValue(1);

    await capturedHandler({ step: mockStep });

    const today = new Date().toISOString().split("T")[0];
    expect(mockIngestItem).toHaveBeenCalledWith(expect.anything(), today);
    expect(mockDedupAndFilter).toHaveBeenCalledWith(today);
    expect(mockSynthesize).toHaveBeenCalledWith(today);
  });

  it("computes correct discard count in notification", async () => {
    mockFetchYouTubeItems.mockResolvedValue([
      makeFetchedItem("yt1"),
      makeFetchedItem("yt2"),
      makeFetchedItem("yt3"),
    ]);
    mockFetchRedditItems.mockResolvedValue([makeFetchedItem("rd1", "reddit")]);
    mockIngestItem.mockResolvedValue("raw-id");
    mockDedupAndFilter.mockResolvedValue(["raw-id"]); // 1 kept out of 4
    mockSynthesize.mockResolvedValue(1);

    await capturedHandler({ step: mockStep });

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        itemsFetched: 4,
        itemsKept: 1,
        itemsDiscarded: 3,
        contentPiecesCreated: 1,
      })
    );
  });
});
