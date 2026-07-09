import { spawn } from "child_process";

export const CLAUDE_CONCURRENCY = 5;

export async function pMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number = CLAUDE_CONCURRENCY
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

interface ClaudeCodeOptions {
  systemPrompt: string;
  userMessage: string;
  jsonSchema?: Record<string, unknown>;
  rawText?: boolean;
  maxTokens?: number;
}

/**
 * Escape raw control characters (newlines, tabs, etc.) that appear *inside*
 * JSON string literals, leaving structural whitespace between tokens untouched.
 * The model occasionally emits these unescaped, producing invalid JSON.
 */
function escapeControlCharsInStrings(json: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of json) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        if (ch === "\n") out += "\\n";
        else if (ch === "\r") out += "\\r";
        else if (ch === "\t") out += "\\t";
        else out += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
    }
    out += ch;
  }
  return out;
}

export async function callClaudeCode<T>(options: ClaudeCodeOptions): Promise<T> {
  const { systemPrompt, userMessage, jsonSchema, rawText } = options;

  let fullPrompt = userMessage;
  let systemSuffix = "";

  if (!rawText && jsonSchema) {
    fullPrompt += `\n\nIMPORTANT: You MUST respond with ONLY valid JSON matching this schema. No markdown, no explanation, no code fences — just the raw JSON object.\n\nSchema:\n${JSON.stringify(jsonSchema, null, 2)}`;
    systemSuffix = "\n\nAlways respond with ONLY valid JSON. Never wrap in markdown code fences.";
  }

  const args = [
    "-p", "-",
    "--output-format", "json",
    "--system-prompt", systemPrompt + systemSuffix,
    "--model", "sonnet",
    "--no-session-persistence",
  ];

  const maxAttempts = rawText ? 1 : 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const stdout = await new Promise<string>((resolve, reject) => {
      const proc = spawn("claude", args, { stdio: ["pipe", "pipe", "pipe"] });
      const chunks: Buffer[] = [];
      proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
      proc.stderr.on("data", () => {});
      proc.on("error", reject);
      proc.on("close", (code) => {
        const output = Buffer.concat(chunks).toString();
        if (code !== 0 && !output) reject(new Error(`claude exited with code ${code}`));
        else resolve(output);
      });
      proc.stdin.write(fullPrompt);
      proc.stdin.end();
    });

    const response = JSON.parse(stdout);

    if (response.is_error) {
      throw new Error(`Claude Code error: ${response.result}`);
    }

    const resultText: string = response.result;

    if (rawText) {
      return resultText as T;
    }

    const cleaned = resultText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // Claude sometimes emits raw control characters (unescaped newlines/tabs)
      // inside JSON string values, which is invalid JSON. Escape them and retry
      // the parse before giving up — this alone recovers most "Bad control
      // character in string literal" failures.
      try {
        return JSON.parse(escapeControlCharsInStrings(cleaned)) as T;
      } catch (parseErr) {
        console.warn(`JSON parse failed (attempt ${attempt}/${maxAttempts}), retrying... Response starts with: ${cleaned.slice(0, 100)}`);
        if (attempt === maxAttempts) throw parseErr;
      }
    }
  }

  throw new Error("Unreachable");
}
