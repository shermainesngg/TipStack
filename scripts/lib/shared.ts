import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

export const supabase = createClient(url, key, { auth: { persistSession: false } });

export interface FetchedItem {
  url: string;
  platform: "youtube" | "reddit" | "twitter" | "news";
  content: string;
  creator: string;
  title: string;
}

export async function isUrlProcessed(targetUrl: string): Promise<boolean> {
  const { data } = await supabase
    .from("sources_log")
    .select("id")
    .eq("url", targetUrl)
    .single();
  return !!data;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const KNOWN_TOOLS: Record<string, string> = {
  claude: "Claude tips",
  "claude code": "Claude Code tips",
  cursor: "Cursor AI tutorial",
  windsurf: "Windsurf AI editor",
  copilot: "GitHub Copilot tips",
  gpt: "ChatGPT tips",
  chatgpt: "ChatGPT tips",
  gemini: "Gemini AI tips",
  n8n: "n8n AI automation",
  langchain: "LangChain tutorial",
  langgraph: "LangGraph agents",
  ollama: "Ollama local LLM",
  "vibe coding": "vibe coding tips",
  aider: "Aider AI coding",
  crewai: "CrewAI agents",
  autogpt: "AutoGPT agents",
  devin: "Devin AI coding",
  replit: "Replit AI agent",
  perplexity: "Perplexity AI",
  v0: "v0 AI frontend",
  bolt: "Bolt AI coding",
  lovable: "Lovable AI",
};

export const AI_KEYWORDS = [
  "ai", "llm", "gpt", "claude", "cursor", "copilot", "agent",
  "prompt", "workflow", "automation", "coding", "windsurf",
  "langchain", "n8n", "ollama", "model", "fine-tune", "rag",
  "embedding", "vector", "chatgpt", "anthropic", "openai",
  "vibe cod", "aider", "bolt", "v0", "replit",
];

export function isActionableAIContent(text: string): boolean {
  const lower = text.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}
