import { callClaudeCode } from "@/lib/ai/claude-code";
import type { FeedPost } from "@/types";

export interface DailyBriefResult {
  headline: string;
  summary: string;
}

const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description:
        "A short, punchy 4-8 word title capturing the day's single biggest theme. No date, no 'Daily Brief' prefix.",
    },
    summary: {
      type: "string",
      description:
        "A 2-3 sentence editor's-note digest of the day's most important AI developments. Specific and concrete, scannable, no hype or filler. Lead with what mattered most.",
    },
  },
  required: ["headline", "summary"],
};

const SYSTEM_PROMPT = `You are the editor of TipStack's daily AI briefing. Given a single day's news and community items, write a tight "Brief" — a 2-3 sentence digest that tells a busy technical reader what mattered most that day and why. Lead with the single biggest development. Be specific and concrete; never use hype or filler like "in today's fast-moving AI landscape". Write in a calm, editorial voice.`;

/** Summarize one day's feed posts into a short editor's-note digest. */
export async function generateDailyBrief(
  posts: FeedPost[]
): Promise<DailyBriefResult> {
  const list = posts
    .slice(0, 20)
    .map(
      (p, i) =>
        `${i + 1}. ${p.headline}\n${p.summary.replace(/\s+/g, " ").trim().slice(0, 300)}`
    )
    .join("\n\n");

  return callClaudeCode<DailyBriefResult>({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: `Here are the ${posts.length} items from this day's briefing. Write "The Brief".\n\n${list}`,
    jsonSchema: BRIEF_SCHEMA,
  });
}

/** Deterministic fallback if the model call fails (keeps backfill/pipeline resilient). */
export function fallbackDailyBrief(posts: FeedPost[]): DailyBriefResult {
  const lead = posts[0]?.headline ?? "AI updates";
  const n = posts.length;
  return {
    headline: lead.length > 60 ? lead.slice(0, 57) + "…" : lead,
    summary: `${n} update${n === 1 ? "" : "s"} today, led by: ${lead}.`,
  };
}
