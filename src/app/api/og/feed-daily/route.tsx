import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { ContentCategory } from "@/types";

interface FeedPostOG {
  headline: string;
  summary: string;
  priority: number;
  published_at: string;
  category: ContentCategory | null;
}

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  claude_code_features: "Claude Code",
  security_and_guardrails: "Security",
  github_skills: "GitHub Skills",
  prompting_and_rules: "Prompting",
  workflow_patterns: "Workflows",
  mcp_and_integrations: "MCP",
  debugging_and_testing: "Testing",
};

const CATEGORY_COLORS: Record<ContentCategory, { bg: string; text: string; sub: string; tag: string }> = {
  claude_code_features: { bg: "#C9A84C", text: "#1A1A2E", sub: "rgba(26,26,46,0.55)", tag: "rgba(26,26,46,0.1)" },
  security_and_guardrails: { bg: "#D4654A", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
  github_skills: { bg: "#7B61A6", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
  prompting_and_rules: { bg: "#F0E6D3", text: "#1A1A2E", sub: "rgba(26,26,46,0.52)", tag: "rgba(26,26,46,0.1)" },
  workflow_patterns: { bg: "#3A6B8C", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
  mcp_and_integrations: { bg: "#4A7C59", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
  debugging_and_testing: { bg: "#5A6B8C", text: "#FFFFFF", sub: "rgba(255,255,255,0.75)", tag: "rgba(255,255,255,0.2)" },
};

const FALLBACK_COLORS = [
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

function mapRow(row: Record<string, unknown>): FeedPostOG {
  const content = row.content as { tags_category: string } | null;
  return {
    headline: row.headline as string,
    summary: row.summary as string,
    priority: row.priority as number,
    published_at: row.published_at as string,
    category: (content?.tags_category as ContentCategory) ?? null,
  };
}

async function getPostsForDate(date: string): Promise<FeedPostOG[]> {
  const client = createBrowserClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const { data } = await client
    .from("feed_posts")
    .select("headline, summary, priority, published_at, content(tags_category)")
    .gte("published_at", dayStart)
    .lte("published_at", dayEnd)
    .order("priority", { ascending: false })
    .limit(6);

  return (data as Record<string, unknown>[] | null)?.map(mapRow) ?? [];
}

async function getLatestPosts(): Promise<{ posts: FeedPostOG[]; date: string } | null> {
  const client = createBrowserClient();
  const { data: latest } = await client
    .from("feed_posts")
    .select("published_at")
    .order("published_at", { ascending: false })
    .limit(1);

  if (!latest || latest.length === 0) return null;

  const date = (latest[0] as { published_at: string }).published_at.split("T")[0];
  const posts = await getPostsForDate(date);
  return { posts, date };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function clamp(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

function getCardColor(post: FeedPostOG, index: number) {
  if (post.category && CATEGORY_COLORS[post.category]) {
    return CATEGORY_COLORS[post.category];
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "social";
  const dateParam = searchParams.get("date");

  const isSquare = format === "social";
  const width = isSquare ? 1080 : 1200;
  const height = isSquare ? 1080 : 630;
  const sq = isSquare;

  let posts: FeedPostOG[];
  let displayDate: string;

  if (dateParam) {
    posts = await getPostsForDate(dateParam);
    if (posts.length === 0) {
      return new Response("No feed posts found for this date", { status: 404 });
    }
    displayDate = dateParam;
  } else {
    const result = await getLatestPosts();
    if (!result) {
      return new Response("No feed posts found", { status: 404 });
    }
    posts = result.posts;
    displayDate = result.date;
  }

  const maxCards = 6;
  const displayPosts = posts.slice(0, maxCards);

  const fontPath = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"
  );
  const geistFont = await readFile(fontPath);

  const cols = displayPosts.length <= 2 ? 2 : 3;
  const rows = Math.ceil(displayPosts.length / cols);

  const headerH = sq ? 130 : 80;
  const gridPad = sq ? 36 : 28;
  const gridH = height - headerH;
  const cardW = Math.floor((width - gridPad * 2 - GAP * (cols - 1)) / cols);
  const cardH = Math.floor((gridH - gridPad * 2 - GAP * (rows - 1)) / rows);

  const tagFontSize = sq ? "13px" : "10px";
  const titleFontSize = sq ? "22px" : "15px";
  const descFontSize = sq ? "13px" : "10px";
  const titleClampLen = sq ? 55 : 42;
  const descClampLen = sq ? 85 : 60;

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
              TipStack Daily
            </span>
            <span
              style={{
                fontSize: sq ? "16px" : "12px",
                color: "#8A8A9A",
                lineHeight: 1,
              }}
            >
              AI workflow tips & updates
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
              {displayPosts.length} {displayPosts.length === 1 ? "story" : "stories"}
            </span>
            <span style={{ fontSize: sq ? "14px" : "11px", color: "#8A8A9A" }}>
              {formatDate(displayDate)}
            </span>
          </div>
        </div>

        {/* Card grid */}
        <div
          style={{
            display: "flex",
            flex: 1,
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
                flex: 1,
              }}
            >
              {Array.from({ length: cols }).map((_, colIdx) => {
                const idx = rowIdx * cols + colIdx;
                if (idx >= displayPosts.length) {
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
                const post = displayPosts[idx];
                const c = getCardColor(post, idx);
                const categoryLabel = post.category
                  ? CATEGORY_LABELS[post.category]
                  : "Update";
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
                        {categoryLabel}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: titleFontSize,
                        fontWeight: 700,
                        color: c.text,
                        lineHeight: 1.2,
                      }}
                    >
                      {clamp(post.headline, titleClampLen)}
                    </span>

                    {post.summary && (
                      <span
                        style={{
                          fontSize: descFontSize,
                          color: c.sub,
                          marginTop: sq ? "10px" : "6px",
                          lineHeight: 1.4,
                        }}
                      >
                        {clamp(post.summary, descClampLen)}
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
