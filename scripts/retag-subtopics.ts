import "./lib/shim-server-only";

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { getAllCategorySlugs, getAllowedSubTopics } from "../src/lib/categories";
import { getPublishedContentByCategory } from "../src/lib/supabase/queries";
import { createServiceClient } from "../src/lib/supabase/server";
import type { Content } from "../src/types";

interface SubTopicRule {
  subTopic: string;
  keywords: string[];
}

const RULES: Record<string, SubTopicRule[]> = {
  claude_code_features: [
    { subTopic: "New Releases", keywords: ["release", "model_updates", "changelog", "launch", "announcement", "comparison", "vs"] },
    { subTopic: "Hooks & Config", keywords: ["hook", "config", "configuration", "settings", "setup", "cursor", "rules", "permission"] },
    { subTopic: "Sub-Agents", keywords: ["agent", "sub-agent", "subagent", "agentic", "multi-agent", "delegation", "autonomous"] },
    { subTopic: "Design Patterns", keywords: ["design", "pattern", "architecture", "structure", "best-practice", "convention", "prototyp", "visual"] },
    { subTopic: "CLI Usage", keywords: ["cli", "terminal", "command", "shell", "bash", "script", "workflow", "prompt"] },
  ],
  security_and_guardrails: [
    { subTopic: "Permissions & Access", keywords: ["permission", "access", "rls", "role", "auth", "access-control"] },
    { subTopic: "API Key Security", keywords: ["api-key", "secret", "credential", "key", "token", "env"] },
    { subTopic: "Production Guardrails", keywords: ["guardrail", "safety", "validation", "production", "deploy"] },
    { subTopic: "Compliance", keywords: ["compliance", "governance", "audit", "policy", "regulation"] },
  ],
  github_skills: [
    { subTopic: "Popular Skills", keywords: ["popular", "community", "trending", "top", "best"] },
    { subTopic: "Building Skills", keywords: ["build", "create", "develop", "skill-creation", "skill-building", "author"] },
    { subTopic: "Skill Configuration", keywords: ["config", "configure", "setup", "install", "setting"] },
    { subTopic: "Use Cases", keywords: ["use-case", "example", "demo", "tutorial", "workflow", "scenario"] },
  ],
  prompting_and_rules: [
    { subTopic: "CLAUDE.md Patterns", keywords: ["claude-md", "claude.md", "project-rules", "rules-file", "agents-md"] },
    { subTopic: "System Prompts", keywords: ["system-prompt", "system_prompt", "instruction", "persona"] },
    { subTopic: "Prompt Engineering", keywords: ["prompt", "prompt_engineering", "prompt-engineering", "technique", "strategy"] },
    { subTopic: "Context Management", keywords: ["context", "context_management", "context-management", "window", "memory", "token"] },
  ],
  workflow_patterns: [
    { subTopic: "CI/CD Integration", keywords: ["cicd", "ci_cd", "ci/cd", "continuous integration", "deploy", "github-action", "github action"] },
    { subTopic: "Multi-Agent Setups", keywords: ["multi-agent", "agent-team", "orchestrat", "parallel", "worktree", "subagent", "harness", "archon", "agent teams"] },
    { subTopic: "Routines", keywords: ["routine", "routines", "scheduled", "recurring", "monitor", "watch", "24/7", "cron", "cloud agent", "set up"] },
    { subTopic: "Automation", keywords: ["automat", "n8n", "pipeline", "batch", "local", "tool", "infrastructure", "gateway", "wiki", "obsidian", "tts", "transcri", "voice", "gpu", "inference", "cad", "browser", "replay", "rss", "memory", "script", "hook", "prompt", "cost", "token"] },
  ],
  mcp_and_integrations: [
    { subTopic: "MCP Servers", keywords: ["mcp-server", "mcp_server", "mcp server", "protocol", "mcp"] },
    { subTopic: "Tool Integrations", keywords: ["tool", "integration", "plugin", "extension", "connect", "canva", "vidiq", "saas", "index"] },
    { subTopic: "API Connections", keywords: ["api", "rest", "graphql", "endpoint", "webhook"] },
    { subTopic: "Community Servers", keywords: ["community", "open-source", "third-party", "popular", "awesome", "code search", "vt code", "structural"] },
  ],
  debugging_and_testing: [
    { subTopic: "Debugging Techniques", keywords: ["debug", "diagnos", "inspect", "trace", "log", "troubleshoot"] },
    { subTopic: "Test Generation", keywords: ["test-gen", "generate", "coverage", "unit-test", "spec"] },
    { subTopic: "TDD Workflows", keywords: ["tdd", "test-driven", "red-green", "test-first"] },
    { subTopic: "Error Handling", keywords: ["error", "exception", "failure", "retry", "recovery", "handling"] },
  ],
};

function pickSubTopic(article: Content, category: string): string {
  const rules = RULES[category];
  if (!rules) return getAllowedSubTopics(category)[0];

  const searchable = [
    article.title,
    article.summary ?? "",
    article.sub_topic ?? "",
    ...article.tags_tool,
    ...article.tags_focus,
    ...article.tags_workflow,
    ...(article.tags_domain ?? []),
  ]
    .join(" ")
    .toLowerCase();

  let bestMatch = rules[rules.length - 1].subTopic;
  let bestScore = 0;

  for (const rule of rules) {
    const score = rule.keywords.filter((kw) => searchable.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule.subTopic;
    }
  }

  return bestMatch;
}

async function main() {
  const client = createServiceClient();
  const categories = getAllCategorySlugs();
  let updated = 0;

  for (const category of categories) {
    const articles = await getPublishedContentByCategory(category, 200);
    const allowed = getAllowedSubTopics(category);
    console.log(`\n${category} (${articles.length} articles, allowed: ${allowed.join(", ")})`);

    for (const article of articles) {
      const oldSub = article.sub_topic ?? "(null)";

      const newSub = pickSubTopic(article, category);

      if (article.sub_topic === newSub) {
        console.log(`  ✓ "${article.title}" — already "${oldSub}"`);
        continue;
      }
      console.log(`  → "${article.title}" — "${oldSub}" → "${newSub}"`);

      const { error } = await client
        .from("content")
        .update({ sub_topic: newSub })
        .eq("id", article.id);

      if (error) {
        console.error(`    FAILED: ${error.message}`);
      } else {
        updated++;
      }
    }
  }

  console.log(`\nDone. Updated ${updated} articles.`);
}

main().catch(console.error);
