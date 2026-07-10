import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { ChangelogEntry, ChangelogChange, ChangeCategory } from "@/types";

const CARD_COLORS = [
  { bg: "#D4654A", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
  { bg: "#F0E6D3", text: "#1A1A2E", sub: "rgba(26,26,46,0.52)", tag: "rgba(26,26,46,0.1)" },
  { bg: "#4A7C59", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
  { bg: "#7B61A6", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
  { bg: "#C9A84C", text: "#1A1A2E", sub: "rgba(26,26,46,0.55)", tag: "rgba(26,26,46,0.1)" },
  { bg: "#3A6B8C", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
];
const HEADER_BG = "#F5F0E8";
const GRID_BG = "#1A1A2E";
const GAP = 10;

const CATEGORY_LABELS: Record<ChangeCategory, string> = {
  new_feature: "New Feature",
  improvement: "Improvement",
  breaking_change: "Breaking Change",
  bug_fix: "Bug Fix",
  deprecation: "Deprecation",
  performance: "Performance",
};

const CHANGELOG_SELECT = "id, title, headline, source_url, version, published_at, created_at, changelog_changes(*)";

function mapEntry(row: Record<string, unknown>): ChangelogEntry {
  return {
    ...(row as unknown as Omit<ChangelogEntry, "changes">),
    changes: (row.changelog_changes as ChangelogChange[]) ?? [],
  };
}

async function getEntriesForDate(date: string): Promise<ChangelogEntry[]> {
  const client = createBrowserClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const { data } = await client
    .from("changelog_entries")
    .select(CHANGELOG_SELECT)
    .gte("published_at", dayStart)
    .lte("published_at", dayEnd)
    .order("published_at", { ascending: false });

  return (data as Record<string, unknown>[])?.map(mapEntry) ?? [];
}

async function getLatestEntry(): Promise<ChangelogEntry | null> {
  const client = createBrowserClient();
  const { data } = await client
    .from("changelog_entries")
    .select(CHANGELOG_SELECT)
    .order("published_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;
  return mapEntry(data[0] as Record<string, unknown>);
}

function extractFeature(change: ChangelogChange): { title: string; desc: string; category: ChangeCategory } {
  const cleaned = change.description
    .replace(
      /^(Add|Fix|Enable|Upgrade|Update|Remove|Implement|Support|Introduce|Include|Allow|Prevent|Improve|Ensure|Make|Set|Use|Show|Hide|Skip|Apply|Store|Track|Bump|Drop|Move|Handle|Expose|Wrap|Catch|Guard|Swap|Wire)\s+/i,
      ""
    )
    .replace(/[`']/g, "")
    .replace(/^\/\w+\s+/, "")
    .replace(/^(and|or|the|a|an)\s+/i, "");

  const prepMatch = cleaned.match(
    /^(.{10,45}?)\s+(with|to|for|from|in|on|by|when|that|which|across|via|after|during|under|so|if|as|and)\s+(.+)$/i
  );

  if (prepMatch) {
    return {
      title: titleCase(prepMatch[1]),
      desc: capitalize(prepMatch[2] + " " + prepMatch[3]),
      category: change.category,
    };
  }

  const words = cleaned.split(/\s+/);
  if (words.length > 5) {
    return {
      title: titleCase(words.slice(0, 4).join(" ")),
      desc: capitalize(words.slice(4).join(" ")),
      category: change.category,
    };
  }

  return { title: titleCase(cleaned), desc: "", category: change.category };
}

function titleCase(str: string): string {
  const small = new Set(["a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "by"]);
  return str
    .split(/\s+/)
    .map((w, i) => {
      if (i > 0 && small.has(w.toLowerCase())) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function toolDisplayName(tool: string): string {
  return tool
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function clamp(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "social";
  const dateParam = searchParams.get("date");

  const isSquare = format === "social";
  const width = isSquare ? 1080 : 1200;
  const sq = isSquare;

  let entry: ChangelogEntry | null = null;
  let allChanges: ChangelogChange[] = [];

  if (dateParam) {
    const entries = await getEntriesForDate(dateParam);
    if (entries.length === 0) {
      return new Response("No changelog entries found for this date", { status: 404 });
    }
    entry = entries[0];
    allChanges = entries.flatMap((e) => e.changes);
  } else {
    entry = await getLatestEntry();
    if (!entry) {
      return new Response("No changelog entries found", { status: 404 });
    }
    allChanges = entry.changes;
  }

  const allTools = [...new Set(allChanges.flatMap((c) => c.affected_tools))];
  const maxCards = 6;
  const features = allChanges.slice(0, maxCards).map(extractFeature);
  const toolName = allTools[0] ? toolDisplayName(allTools[0]) : "AI Tools";

  const fontPath = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"
  );
  const geistFont = await readFile(fontPath);

  const cols = features.length <= 2 ? 2 : 3;
  const rows = Math.ceil(features.length / cols);

  const headerH = sq ? 130 : 80;
  const gridPad = sq ? 36 : 28;
  // Cards are sized to their content instead of stretching to fill a fixed
  // canvas, and the overall image height follows from the row count — this
  // keeps the image compact with no empty space below the text.
  const cardH = sq ? 215 : 150;
  const cardW = Math.floor((width - gridPad * 2 - GAP * (cols - 1)) / cols);
  const height = headerH + gridPad * 2 + rows * cardH + GAP * (rows - 1);

  const tagFontSize = sq ? "13px" : "10px";
  const titleFontSize = sq ? "24px" : "16px";
  const descFontSize = sq ? "14px" : "11px";
  const titleClampLen = sq ? 60 : 45;
  const descClampLen = sq ? 80 : 55;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: GRID_BG,
          fontFamily: "Geist",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            height: `${headerH}px`,
            justifyContent: "space-between",
            alignItems: "flex-end",
            backgroundColor: HEADER_BG,
            padding: sq ? "0 44px 28px" : "0 36px 16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: sq ? "48px" : "32px",
                fontWeight: 700,
                color: "#1A1A2E",
                letterSpacing: "-0.025em",
                lineHeight: 1,
              }}
            >
              {toolName}
            </span>
            <span
              style={{
                fontSize: sq ? "16px" : "12px",
                color: "#8A8A9A",
                lineHeight: 1,
              }}
            >
              {clamp(entry.headline || entry.title, sq ? 70 : 55)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: sq ? "17px" : "13px",
                fontWeight: 700,
                color: "#1A1A2E",
              }}
            >
              {entry.version ?? ""}
            </span>
            <span style={{ fontSize: sq ? "14px" : "11px", color: "#8A8A9A" }}>
              {formatDate(entry.published_at)}
            </span>
          </div>
        </div>

        {/* Card grid */}
        <div
          style={{
            display: "flex",
            padding: `${gridPad}px`,
            flexDirection: "column",
            gap: `${GAP}px`,
          }}
        >
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: "flex",
                gap: `${GAP}px`,
                height: `${cardH}px`,
              }}
            >
              {Array.from({ length: cols }).map((_, colIdx) => {
                const idx = rowIdx * cols + colIdx;
                if (idx >= features.length) {
                  return (
                    <div
                      key={colIdx}
                      style={{
                        display: "flex",
                        flex: 1,
                        width: `${cardW}px`,
                        height: `${cardH}px`,
                        borderRadius: "12px",
                        backgroundColor: "rgba(255,255,255,0.04)",
                      }}
                    />
                  );
                }
                const f = features[idx];
                const c = CARD_COLORS[idx % CARD_COLORS.length];
                return (
                  <div
                    key={colIdx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      width: `${cardW}px`,
                      height: `${cardH}px`,
                      borderRadius: "12px",
                      backgroundColor: c.bg,
                      padding: sq ? "24px 26px" : "16px 18px",
                      justifyContent: "flex-start",
                      overflow: "hidden",
                    }}
                  >
                    {/* Category tag */}
                    <div
                      style={{
                        display: "flex",
                        alignSelf: "flex-start",
                        backgroundColor: c.tag,
                        borderRadius: "6px",
                        padding: sq ? "4px 10px" : "3px 8px",
                        marginBottom: sq ? "16px" : "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: tagFontSize,
                          fontWeight: 700,
                          color: c.text,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {CATEGORY_LABELS[f.category] ?? "Update"}
                      </span>
                    </div>

                    {/* Title */}
                    <span
                      style={{
                        fontSize: titleFontSize,
                        fontWeight: 700,
                        color: c.text,
                        lineHeight: 1.2,
                      }}
                    >
                      {clamp(f.title, titleClampLen)}
                    </span>

                    {/* Description / impact */}
                    {f.desc && (
                      <span
                        style={{
                          fontSize: descFontSize,
                          color: c.sub,
                          marginTop: sq ? "10px" : "6px",
                          lineHeight: 1.4,
                        }}
                      >
                        {clamp(f.desc, descClampLen)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        {
          name: "Geist",
          data: geistFont,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
