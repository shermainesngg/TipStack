import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawContent, ExtractionResult } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockCreate = vi.fn();
vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropicClient: () => ({ messages: { create: mockCreate } }),
  MODEL: "claude-sonnet-4-6-20250514",
}));

const mockGetRawContentByStatus = vi.fn();
const mockInsertContent = vi.fn();
const mockUpdateRawContentStatus = vi.fn();
vi.mock("@/lib/supabase/queries", () => ({
  getRawContentByStatus: (...args: unknown[]) =>
    mockGetRawContentByStatus(...args),
  insertContent: (...args: unknown[]) => mockInsertContent(...args),
  updateRawContentStatus: (...args: unknown[]) =>
    mockUpdateRawContentStatus(...args),
}));

import { synthesize } from "../synthesize";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFilteredItem(
  id: string,
  overrides: Partial<ExtractionResult> = {}
): RawContent {
  return {
    id,
    source_url: `https://youtube.com/watch?v=${id}`,
    platform: "youtube",
    raw_extract: {
      title: `Title ${id}`,
      summary: `Summary for ${id}`,
      tips: ["Use /compact to save context", "Scope file refs precisely"],
      tags_tool: ["claude_code"],
      tags_focus: ["prompt_engineering"],
      tags_workflow: ["coding"],
      quality_signal: "high",
      source_creator: "Test Creator",
      ...overrides,
    },
    status: "filtered",
    batch_date: "2026-04-11",
    created_at: new Date().toISOString(),
  };
}

function mockClaudeSynthesis(
  pieces: {
    title: string;
    slug: string;
    source_items: string[];
  }[]
) {
  mockCreate.mockResolvedValueOnce({
    content: [
      {
        type: "tool_use",
        id: "call_1",
        name: "store_synthesis_results",
        input: {
          content_pieces: pieces.map((p) => ({
            title: p.title,
            slug: p.slug,
            summary: `Summary of ${p.title}`,
            body: `## Overview\n\nDetailed content for ${p.title}.\n\n## Steps\n\n- Step 1\n- Step 2`,
            tags_tool: ["claude_code"],
            tags_focus: ["prompt_engineering"],
            tags_workflow: ["coding"],
            source_items: p.source_items,
            source_urls: p.source_items.map((id) => ({
              url: `https://youtube.com/watch?v=${id}`,
              platform: "youtube",
              creator: "Test Creator",
            })),
          })),
        },
      },
    ],
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("synthesize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertContent.mockResolvedValue("content-id-1");
  });

  it("returns 0 when no filtered items exist", async () => {
    mockGetRawContentByStatus.mockResolvedValue([]);

    const result = await synthesize("2026-04-11");

    expect(result).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockInsertContent).not.toHaveBeenCalled();
  });

  it("synthesizes filtered items into content pieces", async () => {
    mockGetRawContentByStatus.mockResolvedValue([
      makeFilteredItem("aaa"),
      makeFilteredItem("bbb"),
    ]);

    mockClaudeSynthesis([
      {
        title: "Claude Code Productivity Tips",
        slug: "claude-code-productivity-tips",
        source_items: ["aaa", "bbb"],
      },
    ]);

    const result = await synthesize("2026-04-11");

    expect(result).toBe(1);
    expect(mockInsertContent).toHaveBeenCalledTimes(1);
  });

  it("writes content with pending_review status and correct fields", async () => {
    mockGetRawContentByStatus.mockResolvedValue([makeFilteredItem("aaa")]);

    mockClaudeSynthesis([
      {
        title: "Claude Code Tips",
        slug: "claude-code-tips",
        source_items: ["aaa"],
      },
    ]);

    await synthesize("2026-04-11");

    const insertCall = mockInsertContent.mock.calls[0][0];
    expect(insertCall.title).toBe("Claude Code Tips");
    expect(insertCall.slug).toBe("claude-code-tips-2026-04-11");
    expect(insertCall.summary).toBeDefined();
    expect(insertCall.body).toBeDefined();
    expect(insertCall.tagsTool).toEqual(["claude_code"]);
    expect(insertCall.tagsFocus).toEqual(["prompt_engineering"]);
    expect(insertCall.tagsWorkflow).toEqual(["coding"]);
    expect(insertCall.sourceUrls).toHaveLength(1);
    expect(insertCall.sourceUrls[0].platform).toBe("youtube");
  });

  it("appends batch date to slug for uniqueness", async () => {
    mockGetRawContentByStatus.mockResolvedValue([makeFilteredItem("aaa")]);

    mockClaudeSynthesis([
      {
        title: "Test Piece",
        slug: "test-piece",
        source_items: ["aaa"],
      },
    ]);

    await synthesize("2026-04-11");

    const insertCall = mockInsertContent.mock.calls[0][0];
    expect(insertCall.slug).toBe("test-piece-2026-04-11");
  });

  it("marks source raw_content items as merged", async () => {
    mockGetRawContentByStatus.mockResolvedValue([
      makeFilteredItem("aaa"),
      makeFilteredItem("bbb"),
    ]);

    mockClaudeSynthesis([
      {
        title: "Combined Piece",
        slug: "combined-piece",
        source_items: ["aaa", "bbb"],
      },
    ]);

    await synthesize("2026-04-11");

    expect(mockUpdateRawContentStatus).toHaveBeenCalledWith("aaa", "merged");
    expect(mockUpdateRawContentStatus).toHaveBeenCalledWith("bbb", "merged");
  });

  it("handles multiple output pieces from a single batch", async () => {
    mockGetRawContentByStatus.mockResolvedValue([
      makeFilteredItem("aaa"),
      makeFilteredItem("bbb"),
      makeFilteredItem("ccc", { tags_tool: ["cursor"] }),
    ]);

    mockClaudeSynthesis([
      {
        title: "Claude Code Tips",
        slug: "claude-code-tips",
        source_items: ["aaa", "bbb"],
      },
      {
        title: "Cursor Workflow",
        slug: "cursor-workflow",
        source_items: ["ccc"],
      },
    ]);

    const result = await synthesize("2026-04-11");

    expect(result).toBe(2);
    expect(mockInsertContent).toHaveBeenCalledTimes(2);
    expect(mockUpdateRawContentStatus).toHaveBeenCalledTimes(3);
  });

  it("calls Claude with tool_use for structured output", async () => {
    mockGetRawContentByStatus.mockResolvedValue([makeFilteredItem("aaa")]);
    mockClaudeSynthesis([
      {
        title: "Test",
        slug: "test",
        source_items: ["aaa"],
      },
    ]);

    await synthesize("2026-04-11");

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tool_choice).toEqual({
      type: "tool",
      name: "store_synthesis_results",
    });
    expect(callArgs.tools[0].name).toBe("store_synthesis_results");
  });

  it("throws when Claude does not return a tool_use block", async () => {
    mockGetRawContentByStatus.mockResolvedValue([makeFilteredItem("aaa")]);
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "unexpected" }],
    });

    await expect(synthesize("2026-04-11")).rejects.toThrow(
      "Claude did not return a tool_use block"
    );
  });
});
