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
  jsonSchema: Record<string, unknown>;
  maxTokens?: number;
}

export async function callClaudeCode<T>(options: ClaudeCodeOptions): Promise<T> {
  const { systemPrompt, userMessage, jsonSchema } = options;

  const schemaInstruction = `\n\nIMPORTANT: You MUST respond with ONLY valid JSON matching this schema. No markdown, no explanation, no code fences — just the raw JSON object.\n\nSchema:\n${JSON.stringify(jsonSchema, null, 2)}`;

  const fullPrompt = userMessage + schemaInstruction;
  const args = [
    "-p", "-",
    "--output-format", "json",
    "--system-prompt", systemPrompt + "\n\nAlways respond with ONLY valid JSON. Never wrap in markdown code fences.",
    "--model", "sonnet",
    "--no-session-persistence",
  ];

  const maxAttempts = 3;
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

    let resultText: string = response.result;
    resultText = resultText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    try {
      const parsed = JSON.parse(resultText);
      return parsed as T;
    } catch (parseErr) {
      console.warn(`JSON parse failed (attempt ${attempt}/${maxAttempts}), retrying... Response starts with: ${resultText.slice(0, 100)}`);
      if (attempt === maxAttempts) throw parseErr;
    }
  }

  throw new Error("Unreachable");
}
