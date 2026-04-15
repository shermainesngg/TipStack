import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockSend } = vi.hoisted(() => {
  const mockSend = vi.fn();
  return { mockSend };
});

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

import { notifyPipelineComplete } from "../notify";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("notifyPipelineComplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ id: "email-1" });
  });

  it("skips sending when ADMIN_EMAIL is not set", async () => {
    delete process.env.ADMIN_EMAIL;

    await notifyPipelineComplete({
      batchDate: "2026-04-11",
      itemsFetched: 10,
      itemsKept: 5,
      itemsDiscarded: 5,
      contentPiecesCreated: 2,
    });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends email when content pieces were created", async () => {
    process.env.ADMIN_EMAIL = "admin@test.com";

    await notifyPipelineComplete({
      batchDate: "2026-04-11",
      itemsFetched: 10,
      itemsKept: 5,
      itemsDiscarded: 5,
      contentPiecesCreated: 3,
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("admin@test.com");
    expect(call.subject).toContain("3 new pieces ready for review");
  });

  it("sends different subject when no content was created", async () => {
    process.env.ADMIN_EMAIL = "admin@test.com";

    await notifyPipelineComplete({
      batchDate: "2026-04-11",
      itemsFetched: 5,
      itemsKept: 0,
      itemsDiscarded: 5,
      contentPiecesCreated: 0,
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain("no new content");
  });

  it("includes pipeline stats in email body", async () => {
    process.env.ADMIN_EMAIL = "admin@test.com";

    await notifyPipelineComplete({
      batchDate: "2026-04-11",
      itemsFetched: 12,
      itemsKept: 7,
      itemsDiscarded: 5,
      contentPiecesCreated: 3,
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("12");
    expect(call.html).toContain("7");
    expect(call.html).toContain("5");
    expect(call.html).toContain("3");
  });

  it("uses singular form for 1 content piece", async () => {
    process.env.ADMIN_EMAIL = "admin@test.com";

    await notifyPipelineComplete({
      batchDate: "2026-04-11",
      itemsFetched: 3,
      itemsKept: 1,
      itemsDiscarded: 2,
      contentPiecesCreated: 1,
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain("1 new piece ready for review");
    expect(call.subject).not.toContain("pieces");
  });
});
