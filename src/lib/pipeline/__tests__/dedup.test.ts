import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawContent, ExtractionResult } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockCreate = vi.fn();
vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropicClient: () => ({ messages: { create: mockCreate } }),
  MODEL: "claude-sonnet-4-6-20250514",
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

import { dedupAndFilter } from "../dedup";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRawContent(
  id: string,
  overrides: Partial<ExtractionResult> = {}
): RawContent {
  return {
    id,
    source_url: `https://example.com/${id}`,
    platform: "youtube",
    raw_extract: {
      title: `Title ${id}`,
      summary: `Summary for ${id}`,
      tips: ["Tip 1", "Tip 2"],
      tags_tool: ["claude_code"],
      tags_focus: ["prompt_engineering"],
      tags_workflow: ["coding"],
      tags_domain: ["frontend"],
      quality_signal: "high",
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
  mockCreate.mockResolvedValueOnce({
    content: [
      {
        type: "tool_use",
        id: "call_1",
        name: "store_dedup_results",
        input: {
          items: items.map((i) => ({
            ...i,
            reason: i.action === "keep" ? "Good content" : "Low quality",
            duplicate_of: null,
          })),
        },
      },
    ],
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("dedupAndFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublishedContent.mockResolvedValue([]);
  });

  it("returns empty array when no ingested items exist", async () => {
    mockGetRawContentByStatus.mockResolvedValue([]);

    const result = await dedupAndFilter("2026-04-11");

    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("keeps high-quality items and discards low-quality ones", async () => {
    const items = [
      makeRawContent("aaa"),
      makeRawContent("bbb", { quality_signal: "low" }),
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

  it("discards all items when Claude says everything is low quality", async () => {
    const items = [makeRawContent("aaa"), makeRawContent("bbb")];
    mockGetRawContentByStatus.mockResolvedValue(items);

    mockClaudeDedup([
      { id: "aaa", action: "discard", quality_score: 2 },
      { id: "bbb", action: "discard", quality_score: 1 },
    ]);

    const result = await dedupAndFilter("2026-04-11");

    expect(result).toEqual([]);
    expect(mockUpdateRawContentStatus).toHaveBeenCalledTimes(2);
    expect(mockUpdateRawContentStatus).toHaveBeenCalledWith(
      "aaa",
      "discarded"
    );
  });

  it("sends recent published content as cross-batch dedup context", async () => {
    mockGetRawContentByStatus.mockResolvedValue([makeRawContent("aaa")]);
    mockGetPublishedContent.mockResolvedValue([
      { title: "Existing Piece", summary: "Already published content" },
    ]);
    mockClaudeDedup([{ id: "aaa", action: "keep", quality_score: 8 }]);

    await dedupAndFilter("2026-04-11");

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content;
    expect(userMessage).toContain("Recently Published Content");
    expect(userMessage).toContain("Existing Piece");
  });

  it("calls Claude with tool_use for structured output", async () => {
    mockGetRawContentByStatus.mockResolvedValue([makeRawContent("aaa")]);
    mockClaudeDedup([{ id: "aaa", action: "keep", quality_score: 9 }]);

    await dedupAndFilter("2026-04-11");

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tool_choice).toEqual({
      type: "tool",
      name: "store_dedup_results",
    });
    expect(callArgs.tools[0].name).toBe("store_dedup_results");
  });

  it("throws when Claude does not return a tool_use block", async () => {
    mockGetRawContentByStatus.mockResolvedValue([makeRawContent("aaa")]);
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "something went wrong" }],
    });

    await expect(dedupAndFilter("2026-04-11")).rejects.toThrow(
      "Claude did not return a tool_use block"
    );
  });
});
