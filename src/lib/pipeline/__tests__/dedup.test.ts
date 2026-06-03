import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawContent, ExtractionResult } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockCallClaudeCode = vi.fn();
vi.mock("@/lib/ai/claude-code", () => ({
  callClaudeCode: (...args: unknown[]) => mockCallClaudeCode(...args),
}));

const mockGetRawContentByStatus = vi.fn();
const mockUpdateRawContentStatus = vi.fn();
const mockGetPublishedContent = vi.fn();
vi.mock("@/lib/supabase/queries", () => ({
  getRawContentByStatus: (...args: unknown[]) =>
    mockGetRawContentByStatus(...args),
  updateRawContentStatus: (...args: unknown[]) =>
    mockUpdateRawContentStatus(...args),
  getPublishedContent: (...args: unknown[]) =>
    mockGetPublishedContent(...args),
}));

import { dedupAndFilter, codeDedup } from "../dedup";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRawContent(
  id: string,
  overrides: Partial<ExtractionResult> = {},
  platform: "youtube" | "reddit" | "twitter" | "news" | "docs" = "youtube"
): RawContent {
  return {
    id,
    source_url: `https://example.com/${id}`,
    platform,
    raw_extract: {
      title: `Title ${id}`,
      summary: `Summary for ${id}`,
      tips: ["Tip 1", "Tip 2"],
      tags_tool: ["claude_code"],
      tags_focus: ["prompt_engineering"],
      tags_workflow: ["coding"],
      tags_domain: ["frontend"],
      tags_category: "prompting_and_rules",
      quality_signal: "high",
      quality_score: 8,
      source_creator: "Test Creator",
      ...overrides,
    },
    status: "ingested",
    batch_date: "2026-04-11",
    created_at: new Date().toISOString(),
  };
}

function mockClaudeDedup(
  items: { id: string; action: "keep" | "discard"; quality_score: number }[]
) {
  mockCallClaudeCode.mockResolvedValueOnce({
    items: items.map((i) => ({
      ...i,
      reason: i.action === "keep" ? "Good content" : "Low quality",
      duplicate_of: null,
    })),
  });
}

// ── Tests: dedupAndFilter (Claude-based, kept for Inngest fallback) ─────────

describe("dedupAndFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublishedContent.mockResolvedValue([]);
  });

  it("returns empty array when no ingested items exist", async () => {
    mockGetRawContentByStatus.mockResolvedValue([]);

    const result = await dedupAndFilter("2026-04-11");

    expect(result).toEqual([]);
    expect(mockCallClaudeCode).not.toHaveBeenCalled();
  });

  it("keeps high-quality items and discards low-quality ones", async () => {
    const items = [
      makeRawContent("aaa"),
      makeRawContent("bbb", { quality_signal: "low", quality_score: 3 }),
      makeRawContent("ccc"),
    ];
    mockGetRawContentByStatus.mockResolvedValue(items);

    mockClaudeDedup([
      { id: "aaa", action: "keep", quality_score: 8 },
      { id: "bbb", action: "discard", quality_score: 3 },
      { id: "ccc", action: "keep", quality_score: 7 },
    ]);

    const result = await dedupAndFilter("2026-04-11");

    expect(result).toEqual(["aaa", "ccc"]);
    expect(mockUpdateRawContentStatus).toHaveBeenCalledWith("aaa", "filtered");
    expect(mockUpdateRawContentStatus).toHaveBeenCalledWith(
      "bbb",
      "discarded"
    );
    expect(mockUpdateRawContentStatus).toHaveBeenCalledWith("ccc", "filtered");
  });
});

// ── Tests: codeDedup (no Claude call) ───────────────────────────────────────

describe("codeDedup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty when no ingested items exist", async () => {
    mockGetRawContentByStatus.mockResolvedValue([]);

    const result = await codeDedup("2026-04-11");

    expect(result).toEqual({ kept: [], discarded: [] });
    expect(mockCallClaudeCode).not.toHaveBeenCalled();
  });

  it("filters items below platform quality threshold", async () => {
    const items = [
      makeRawContent("yt1", { title: "YouTube Coding Workflow", quality_score: 6, tags_focus: ["coding"] }, "youtube"),
      makeRawContent("rd1", { title: "Reddit Discussion Thread", quality_score: 6, tags_focus: ["security"] }, "reddit"),
      makeRawContent("tw1", { title: "Twitter Quick Tips", quality_score: 5, tags_focus: ["automation"] }, "twitter"),
      makeRawContent("nw1", { title: "Hacker News Roundup", quality_score: 5, tags_focus: ["model_updates"] }, "news"),
    ];
    mockGetRawContentByStatus.mockResolvedValue(items);

    const result = await codeDedup("2026-04-11");

    expect(result.kept).toContain("yt1");
    expect(result.kept).toContain("nw1");
    expect(result.discarded).toContain("rd1");
    expect(result.discarded).toContain("tw1");
    expect(mockCallClaudeCode).not.toHaveBeenCalled();
  });

  it("deduplicates items with similar titles and overlapping tags", async () => {
    const items = [
      makeRawContent("aaa", {
        title: "Claude Code Context Management Tips",
        quality_score: 9,
        tags_tool: ["claude_code"],
        tags_focus: ["context_management"],
      }),
      makeRawContent("bbb", {
        title: "Tips for Managing Context in Claude Code",
        quality_score: 7,
        tags_tool: ["claude_code"],
        tags_focus: ["context_management"],
      }),
    ];
    mockGetRawContentByStatus.mockResolvedValue(items);

    const result = await codeDedup("2026-04-11");

    expect(result.kept).toEqual(["aaa"]);
    expect(result.discarded).toEqual(["bbb"]);
  });

  it("keeps items with different topics even if same tools", async () => {
    const items = [
      makeRawContent("aaa", {
        title: "Claude Code Security Best Practices",
        quality_score: 8,
        tags_tool: ["claude_code"],
        tags_focus: ["security"],
      }),
      makeRawContent("bbb", {
        title: "Claude Code Prompt Engineering Guide",
        quality_score: 8,
        tags_tool: ["claude_code"],
        tags_focus: ["prompt_engineering"],
      }),
    ];
    mockGetRawContentByStatus.mockResolvedValue(items);

    const result = await codeDedup("2026-04-11");

    expect(result.kept).toContain("aaa");
    expect(result.kept).toContain("bbb");
    expect(result.discarded).toEqual([]);
  });
});
