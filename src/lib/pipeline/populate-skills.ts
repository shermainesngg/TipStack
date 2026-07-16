import { callClaudeCode } from "@/lib/ai/claude-code";
import { upsertSkill } from "@/lib/supabase/queries";
import type { FetchedSkillMeta, SkillType } from "@/types";

const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    skill_type: {
      type: "string",
      enum: [
        "design_systems",
        "claude_md_rules",
        "mcp_tools",
        "cli_tools",
        "workflow_automation",
        "testing_qa",
        "code_generation",
        "documentation",
      ],
      description: "The skill type category that best fits this repository",
    },
    skill_subcategory: {
      type: "string",
      description:
        "A short subcategory label (2-3 words, Title Case) that groups related skills within the type. E.g. 'Database', 'API Integration', 'Git Hooks', 'React Components'.",
    },
    summary: {
      type: "string",
      description:
        "One crisp phrase, max 10 words, saying what this skill does. Written for a small card. Start with a verb. No filler, no 'This skill', 'A tool that', or restating the name.",
    },
    use_case: {
      type: "string",
      description:
        "1-2 short sentences, max 30 words, on when to reach for this skill. Lead with the trigger or problem. No filler, no restating the name, no marketing.",
    },
  },
  required: ["skill_type", "skill_subcategory", "summary", "use_case"],
};

const CLASSIFY_SYSTEM_PROMPT = `You classify Claude Code community skills into one of these types:

- design_systems: UI/UX design skills, style guides, component generators (e.g. impeccable, taste-skill)
- claude_md_rules: CLAUDE.md rule templates, project configuration patterns
- mcp_tools: MCP server-based skill extensions
- cli_tools: NPX-installable command-line tools and utilities
- workflow_automation: CI/CD skills, multi-agent pipelines, automation
- testing_qa: Test generation, TDD workflows, quality assurance
- code_generation: Scaffolding, boilerplate generators, code templates
- documentation: Doc generation, README tools, API documentation

Based on the repo name, description, topics, and README excerpt:
1. Classify it into exactly one type.
2. Pick a short subcategory label (2-3 words, Title Case) that groups related skills within that type. Examples: "Database", "API Integration", "Git Hooks", "React Components", "Markdown Linting", "Multi Agent". Reuse existing subcategory names when the skill fits — prefer consistency over novelty.
3. Write a "summary" — one crisp phrase, max 10 words, starting with a verb, saying what it does. Appears on a small card. No filler, no "This skill"/"A tool that", no restating the name.
4. Write a "use_case" — 1-2 short sentences, max 30 words, on when you'd reach for it. Lead with the trigger or problem. No filler, no marketing, no restating the name.

Be ruthless about concision — every word must earn its place. Respond with valid JSON matching the schema provided.`;

interface ClassifyResult {
  skill_type: SkillType;
  skill_subcategory: string;
  summary: string;
  use_case: string;
}

async function classifySkill(meta: FetchedSkillMeta): Promise<ClassifyResult> {
  const userMessage = `Classify this skill:

Name: ${meta.name}
Description: ${meta.description}
Author: ${meta.author}
Topics: ${meta.topics.join(", ")}

README excerpt:
${meta.readmeExcerpt.slice(0, 3000)}`;

  return callClaudeCode<ClassifyResult>({
    systemPrompt: CLASSIFY_SYSTEM_PROMPT,
    userMessage,
    jsonSchema: CLASSIFY_SCHEMA,
  });
}

export async function populateSkills(
  skillMetas: Map<string, FetchedSkillMeta>
): Promise<Map<string, string>> {
  const repoUrlToSkillId = new Map<string, string>();

  for (const [repoUrl, meta] of skillMetas) {
    try {
      const { skill_type, skill_subcategory, summary, use_case } = await classifySkill(meta);
      const skillId = await upsertSkill({ ...meta, skillType: skill_type, skillSubcategory: skill_subcategory, summary, useCase: use_case });
      repoUrlToSkillId.set(repoUrl, skillId);
      console.log(`  Classified "${meta.name}" as ${skill_type} > ${skill_subcategory} (${meta.stars} stars)`);
    } catch (err) {
      console.warn(`  Failed to populate skill "${meta.name}":`, err);
    }
  }

  return repoUrlToSkillId;
}
