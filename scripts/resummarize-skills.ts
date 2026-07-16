/**
 * Re-summarize existing skills with the tightened, succinct prompt.
 * Updates only `summary` + `use_case` (keeps type/subcategory).
 *
 *   npx tsx scripts/resummarize-skills.ts                 # all active skills
 *   npx tsx scripts/resummarize-skills.ts --limit 8       # first 8 (by stars)
 *   npx tsx scripts/resummarize-skills.ts --names a,b,c   # specific names
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { callClaudeCode, pMap } from "../src/lib/ai/claude-code";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description:
        "One crisp phrase, max 10 words, starting with a verb, saying what this skill does. No filler, no 'This skill'/'A tool that', no restating the name.",
    },
    use_case: {
      type: "string",
      description:
        "1-2 short sentences, max 30 words, on when to reach for this skill. Lead with the trigger or problem. No filler, no marketing, no restating the name.",
    },
  },
  required: ["summary", "use_case"],
};

const SYSTEM_PROMPT = `You write ultra-concise copy for a skill card on TipStack, a curated directory of Claude Code skills.

Given a skill's name, description, topics, and README excerpt, write:
1. "summary" — one crisp phrase, max 10 words, starting with a verb, saying what it does. No filler, no "This skill"/"A tool that", no restating the name.
2. "use_case" — 1-2 short sentences, max 30 words, on when you'd reach for it. Lead with the trigger or problem. No filler, no marketing.

Be ruthless about concision — every word must earn its place. Respond with valid JSON matching the schema provided.`;

interface Row {
  id: string;
  name: string;
  description: string | null;
  topics: string[];
  readme_excerpt: string | null;
  summary: string | null;
  use_case: string | null;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf("--limit");
  const namesArg = args.indexOf("--names");
  const limit = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : undefined;
  const names =
    namesArg >= 0 ? args[namesArg + 1].split(",").map((s) => s.trim()) : undefined;

  let query = supabase
    .from("skills")
    .select("id,name,description,topics,readme_excerpt,summary,use_case")
    .eq("status", "active")
    .order("stars", { ascending: false });
  if (names) query = query.in("name", names);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  const rows = (data ?? []) as Row[];
  console.log(`Re-summarizing ${rows.length} skills (concurrency 5)...\n`);

  let ok = 0;
  let failed = 0;

  await pMap(rows, async (row) => {
    try {
      const userMessage = `Skill: ${row.name}
Description: ${row.description ?? "(none)"}
Topics: ${(row.topics ?? []).join(", ")}

README excerpt:
${(row.readme_excerpt ?? "").slice(0, 3000)}`;

      const { summary, use_case } = await callClaudeCode<{
        summary: string;
        use_case: string;
      }>({ systemPrompt: SYSTEM_PROMPT, userMessage, jsonSchema: SCHEMA });

      const { error: updErr } = await supabase
        .from("skills")
        .update({ summary, use_case })
        .eq("id", row.id);
      if (updErr) throw new Error(updErr.message);

      ok++;
      console.log(`✓ ${row.name}`);
      console.log(`    old summary: ${row.summary ?? "(none)"}`);
      console.log(`    new summary: ${summary}`);
      console.log(`    new use_case: ${use_case}\n`);
    } catch (err) {
      failed++;
      console.warn(`✗ ${row.name}: ${err instanceof Error ? err.message : err}`);
    }
  });

  console.log(`\nDone. Updated ${ok}, failed ${failed}.`);
}

main();
