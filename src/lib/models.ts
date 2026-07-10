// ─────────────────────────────────────────────────────────────────────────────
// Seed data for the /models dashboard (Option C: living model page).
//
// Editorial content is hardcoded for now. In production, split into two halves:
//   • STABLE editorial fields (tagline, rundown, bestFor, strengths, weaknesses,
//     specs, scores) → a small curated table or MDX, edited rarely.
//   • VOLATILE `updates` → auto-populated from `feed_posts` tagged with a new
//     `tags_model` dimension (see normalizeModelTag TODO in the pipeline).
//
// Specs verified via web research (Jul 2026): Anthropic/OpenAI/Google/DeepSeek
// docs + Simon Willison, llm-stats, artificialanalysis, pricepertoken.
// `scores` are editorial 1–5 estimates for at-a-glance comparison, NOT benchmarks.
// ─────────────────────────────────────────────────────────────────────────────

export type ModelTier = "frontier" | "workhorse" | "fast" | "open";

export interface ModelUpdate {
  headline: string;
  date: string; // ISO
  source: string; // outlet / platform label
}

export interface ModelScores {
  coding: number;
  reasoning: number;
  speed: number;
  affordability: number;
  multimodal: number;
}

export interface Model {
  slug: string;
  name: string;
  maker: MakerKey;
  tier: ModelTier;
  tagline: string;
  // ── stable editorial half ──
  rundown: string;
  bestFor: string[];
  strengths: string[];
  weaknesses: string[];
  // ── comparable capability scores (1–5, higher = better) ──
  scores: ModelScores;
  // ── semi-volatile specs (date-stamped, not authoritative) ──
  contextWindow: string;
  contextTokens: number; // numeric, for comparison bars
  modality: string;
  released: string;
  priceTier: string;
  specsChecked: string;
  // ── access status ──
  restricted?: boolean; // not generally available
  access?: string; // how it's gated, if restricted
  // ── volatile half (would be pipeline-fed from feed_posts) ──
  updates: ModelUpdate[];
  featured?: boolean;
}

export type MakerKey =
  | "anthropic"
  | "openai"
  | "google"
  | "xai"
  | "meta"
  | "deepseek";

export interface MakerConfig {
  label: string;
  chip: string; // tinted text+bg for eyebrow chip
  tint: string; // card background (light)
  darkTint: string; // card background (dark)
  dot: string; // solid accent dot / bar fill
  ring: string; // selected-state ring color
}

export const MAKERS: Record<MakerKey, MakerConfig> = {
  anthropic: {
    label: "Anthropic",
    chip: "text-[#8B4A4A] bg-[#f0dbd8] dark:text-[#E5A097] dark:bg-[#3D2424]",
    tint: "bg-[#faf0ef]",
    darkTint: "dark:bg-[#2e1e1c]",
    dot: "bg-[#C4614E]",
    ring: "ring-[#C4614E]",
  },
  openai: {
    label: "OpenAI",
    chip: "text-[#2D6040] bg-[#d2e8d6] dark:text-[#7EBE8E] dark:bg-[#1A3327]",
    tint: "bg-[#f0f8f2]",
    darkTint: "dark:bg-[#1a2b1e]",
    dot: "bg-[#4E9A8E]",
    ring: "ring-[#4E9A8E]",
  },
  google: {
    label: "Google DeepMind",
    chip: "text-[#1A4A40] bg-[#B8D8D0] dark:text-[#80BEB4] dark:bg-[#152E28]",
    tint: "bg-[#eef5fa]",
    darkTint: "dark:bg-[#1a2530]",
    dot: "bg-[#6A7EA8]",
    ring: "ring-[#6A7EA8]",
  },
  xai: {
    label: "xAI",
    chip: "text-[#3A423A] bg-[#CDD5CA] dark:text-[#C8D0C6] dark:bg-[#2A322A]",
    tint: "bg-[#f4f6f3]",
    darkTint: "dark:bg-[#1E241E]",
    dot: "bg-[#7A857A]",
    ring: "ring-[#7A857A]",
  },
  meta: {
    label: "Meta",
    chip: "text-[#5E3F96] bg-[#e0d8ef] dark:text-[#B89DD4] dark:bg-[#2A1F3D]",
    tint: "bg-[#f3eff8]",
    darkTint: "dark:bg-[#221e2e]",
    dot: "bg-[#9A6A8E]",
    ring: "ring-[#9A6A8E]",
  },
  deepseek: {
    label: "DeepSeek",
    chip: "text-[#7B6230] bg-[#f0e8d4] dark:text-[#D4B875] dark:bg-[#2E2818]",
    tint: "bg-[#f9f5ec]",
    darkTint: "dark:bg-[#2a261a]",
    dot: "bg-[#C79A3E]",
    ring: "ring-[#C79A3E]",
  },
};

export const TIER_LABEL: Record<ModelTier, string> = {
  frontier: "Frontier",
  workhorse: "Workhorse",
  fast: "Fast & cheap",
  open: "Open weight",
};

export const SCORE_DIMS = [
  { key: "coding", label: "Coding" },
  { key: "reasoning", label: "Reasoning" },
  { key: "speed", label: "Speed" },
  { key: "affordability", label: "Affordability" },
  { key: "multimodal", label: "Multimodal" },
] as const;

export type ScoreKey = (typeof SCORE_DIMS)[number]["key"];

const MODELS: Model[] = [
  {
    slug: "claude-fable-5",
    name: "Claude Fable 5",
    maker: "anthropic",
    tier: "frontier",
    featured: true,
    tagline:
      "Anthropic's most capable public model — the frontier flagship behind Claude Code.",
    rundown:
      "Fable 5 is Anthropic's most capable publicly released model and the flagship that powers Claude Code. It's built for the most demanding reasoning and long-horizon agentic work — software engineering, research, and vision-heavy knowledge tasks — and carries safety classifiers that can decline high-risk requests, with automatic fallback to another Claude model. It's a larger, slower, and pricier model than Opus 4.8, and the default when you want maximum capability.",
    bestFor: [
      "Demanding agentic coding and long refactors",
      "Long-horizon reasoning & research",
      "Vision and knowledge-heavy work",
    ],
    strengths: [
      "State-of-the-art coding, knowledge, and vision",
      "1M-token context for whole-repo work",
      "Broadest world knowledge in the Claude lineup",
    ],
    weaknesses: [
      "Slow and expensive (~2× Opus output cost)",
      "Can refuse high-risk requests; needs fallback handling",
      "No zero-data-retention option",
    ],
    scores: { coding: 5, reasoning: 5, speed: 2, affordability: 1, multimodal: 4 },
    contextWindow: "1M tokens",
    contextTokens: 1_000_000,
    modality: "Text + vision",
    released: "Jun 2026",
    priceTier: "Premium ($$$$)",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "Fable 5 redeployed with a hardened safety classifier", date: "2026-07-01", source: "Anthropic" },
      { headline: "Simon Willison: Fable 5 rewrote a full library in hours", date: "2026-06-09", source: "Blog" },
      { headline: "Fable 5 ships to Claude Code, Claude.ai, and Cowork", date: "2026-06-09", source: "News" },
    ],
  },
  {
    slug: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    maker: "anthropic",
    tier: "frontier",
    tagline:
      "The pragmatic frontier pick for agentic coding — most of Fable 5's strength, cheaper and faster.",
    rundown:
      "Opus 4.8 is Anthropic's frontier model for agentic coding and long-horizon reasoning, sitting just below the larger Fable 5 flagship. For most hard coding and reasoning work it's the pragmatic top choice — cheaper and faster than Fable 5 while still holding a 1M-token context across long sessions, with an optional fast mode and parallel-subagent Workflows in Claude Code.",
    bestFor: [
      "Agentic coding across large codebases",
      "Long-horizon, multi-step autonomous tasks",
      "Hard reasoning where accuracy beats speed",
    ],
    strengths: [
      "Top-tier agentic tool use and instruction-following",
      "1M-token context handles whole repositories",
      "Reasons directly over PDFs and diagrams",
    ],
    weaknesses: [
      "Below Fable 5 on the hardest knowledge tasks",
      "Premium output pricing",
      "Overkill for routine autocomplete or short chat",
    ],
    scores: { coding: 5, reasoning: 5, speed: 3, affordability: 2, multimodal: 4 },
    contextWindow: "1M tokens",
    contextTokens: 1_000_000,
    modality: "Text + vision",
    released: "May 2026",
    priceTier: "High ($$$)",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "Opus 4.8 fast mode enters research preview (~2.5× faster)", date: "2026-06-20", source: "Anthropic" },
      { headline: "Community: Opus 4.8 tops internal agentic-refactor evals", date: "2026-06-21", source: "Reddit" },
    ],
  },
  {
    slug: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    maker: "anthropic",
    tier: "workhorse",
    tagline:
      "The most agentic Sonnet yet — near-Opus capability at a fraction of the cost, now with 1M context.",
    rundown:
      "Sonnet 5 is the everyday workhorse of the Claude lineup, and the most agentic Sonnet to date — planning, tool use, and autonomous runs that recently required larger models. It now ships with a 1M-token context and aggressive pricing, making it the right default for most production pipelines and IDE assistants, with Opus or Fable reserved for the genuinely hard steps.",
    bestFor: [
      "Production pipelines and high-volume tool calls",
      "IDE assistants and everyday coding",
      "Cost-sensitive work that still needs real reasoning",
    ],
    strengths: [
      "Near-Opus agentic capability at much lower cost",
      "1M-token context",
      "Strong planning, tool use, and autonomous runs",
    ],
    weaknesses: [
      "Below Opus / Fable on the hardest tasks",
      "Adaptive thinking forced on; some sampling params rejected",
    ],
    scores: { coding: 4, reasoning: 4, speed: 4, affordability: 3, multimodal: 4 },
    contextWindow: "1M tokens",
    contextTokens: 1_000_000,
    modality: "Text + vision",
    released: "Jun 2026",
    priceTier: "Mid ($$)",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "Sonnet 5 launches with a 1M-token context and intro pricing", date: "2026-06-30", source: "Anthropic" },
      { headline: "Sonnet 5 becomes the default model in several agent frameworks", date: "2026-06-18", source: "Blog" },
    ],
  },
  {
    slug: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    maker: "anthropic",
    tier: "fast",
    tagline: "Fastest and cheapest Claude — Sonnet-4-class quality for high-volume work.",
    rundown:
      "Haiku 4.5 is Anthropic's fastest and cheapest model, matching Sonnet-4-class quality on coding, computer-use, and agent tasks at a fraction of the cost and more than twice the speed. It's the model you reach for in the wide, shallow parts of a pipeline — classification, extraction, routing, and subagent fan-out — not the deep reasoning steps.",
    bestFor: [
      "High-volume classification and extraction",
      "Latency-sensitive, user-facing responses",
      "Cheap first-pass filtering and subagent fan-out",
    ],
    strengths: [
      "Very low latency and cost",
      "≈ Sonnet-4 quality with full tool support",
      "Great for multi-agent / batch workloads",
    ],
    weaknesses: [
      "Below the frontier on hard reasoning",
      "Smallest context here (200K)",
      "Knowledge cutoff Feb 2025",
    ],
    scores: { coding: 3, reasoning: 2, speed: 5, affordability: 5, multimodal: 3 },
    contextWindow: "200K tokens",
    contextTokens: 200_000,
    modality: "Text + vision",
    released: "Oct 2025",
    priceTier: "Low ($)",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "Haiku 4.5 cuts batch-extraction costs in the standard pipeline pattern", date: "2026-06-25", source: "Docs" },
    ],
  },
  {
    slug: "claude-mythos-5",
    name: "Claude Mythos 5",
    maker: "anthropic",
    tier: "frontier",
    restricted: true,
    access: "Project Glasswing partners only",
    tagline:
      "Fable 5's capabilities without the safety classifiers — a restricted, gated research model.",
    rundown:
      "Mythos 5 is the same underlying model as Fable 5 with its safety classifiers removed. Anthropic restricts it to approved partners through its Project Glasswing trusted-access program — it is not generally available. It targets high-stakes security and scientific research (Anthropic claims the strongest cybersecurity capabilities of any model) and exists largely to explain why the public Fable 5 ships with safeguards. Listed here for awareness — most teams cannot access it.",
    bestFor: [
      "Approved cybersecurity research",
      "Frontier bio / scientific research (gated)",
      "Red-teaming and safety evaluation",
    ],
    strengths: [
      "Full Fable-5 capability with no refusal friction",
      "Reportedly the strongest cybersecurity model",
      "Frontier reasoning and coding",
    ],
    weaknesses: [
      "Not publicly available — Project Glasswing partners only",
      "High-risk; tightly governed access",
      "Not intended for general production use",
    ],
    scores: { coding: 5, reasoning: 5, speed: 2, affordability: 1, multimodal: 4 },
    contextWindow: "1M tokens",
    contextTokens: 1_000_000,
    modality: "Text + vision",
    released: "Jun 2026",
    priceTier: "Restricted",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "Anthropic gates Mythos 5 behind the Project Glasswing program", date: "2026-06-09", source: "Anthropic" },
    ],
  },
  {
    slug: "gpt-5-5",
    name: "GPT-5.5",
    maker: "openai",
    tier: "frontier",
    tagline:
      "OpenAI's current frontier — 1M context and much-improved agentic coding, broadest ecosystem.",
    rundown:
      "GPT-5.5 is OpenAI's mid-2026 flagship, a strong all-rounder that closed much of the agentic-coding gap with Claude and added a 1M-token context. It's the natural choice for teams already invested in the OpenAI ecosystem, and well worth benchmarking head-to-head against Fable 5 and Opus on your own workloads. (Supersedes GPT-5, from Aug 2025.)",
    bestFor: [
      "Teams standardized on the OpenAI ecosystem",
      "Agentic coding and general reasoning",
      "Broad tool / integration needs",
    ],
    strengths: [
      "Strong agentic coding — much improved over GPT-5",
      "1M-token context",
      "Largest ecosystem and tooling surface",
    ],
    weaknesses: [
      "Output pricing on the premium side",
      "Coding / reasoning still trails the top Claude models on some evals",
    ],
    scores: { coding: 4, reasoning: 4, speed: 3, affordability: 2, multimodal: 4 },
    contextWindow: "1M tokens",
    contextTokens: 1_000_000,
    modality: "Text + vision",
    released: "Apr 2026",
    priceTier: "Premium ($$$)",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "GPT-5.5 launches with a 1M context and stronger agentic coding", date: "2026-04-23", source: "News" },
    ],
  },
  {
    slug: "gemini-3-5-pro",
    name: "Gemini 3.5 Pro",
    maker: "google",
    tier: "frontier",
    tagline:
      "Google's frontier multimodal model — native video/audio/image and a 2M-token context.",
    rundown:
      "Gemini 3.5 Pro is Google DeepMind's flagship and the multimodal leader of this group: it natively reasons over text, images, audio, and video in one model, with a 2M-token context for very large document and media sets. If your workload is multimodal or context-hungry, benchmark it first. (Announced in enterprise preview; pricing still firming up.)",
    bestFor: [
      "Multimodal tasks (video, audio, image)",
      "Very large context / long-document reasoning",
      "Teams on Google Cloud tooling",
    ],
    strengths: [
      "Best-in-class native multimodal (adds video + audio)",
      "2M-token context — largest here",
      "Strong reasoning and retrieval over huge inputs",
    ],
    weaknesses: [
      "Enterprise preview; pricing not fully settled",
      "Agentic-coding ergonomics vary by harness",
    ],
    scores: { coding: 4, reasoning: 4, speed: 3, affordability: 3, multimodal: 5 },
    contextWindow: "2M tokens",
    contextTokens: 2_000_000,
    modality: "Text + vision + audio + video",
    released: "May 2026",
    priceTier: "Premium (est.)",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "Gemini 3.5 Pro brings a 2M context and full multimodal input", date: "2026-05-19", source: "Blog" },
    ],
  },
  {
    slug: "deepseek-v4",
    name: "DeepSeek V4",
    maker: "deepseek",
    tier: "open",
    tagline:
      "Open-weight, frontier-class coding at a fraction of the cost — self-host under MIT.",
    rundown:
      "DeepSeek V4 is the strongest open-weight option to watch: MIT-licensed, self-hostable, and dramatically cheaper than hosted frontier models, while landing near the top of open-weights coding benchmarks (~80% SWE-bench Verified). It ships in Pro and Flash variants and now handles a 1M-token context, making it viable for repo-level work where you need data control or rock-bottom marginal cost.",
    bestFor: [
      "Self-hosting / data-control requirements",
      "Very high volume where marginal cost dominates",
      "Fine-tuning on proprietary data",
    ],
    strengths: [
      "Open weights (MIT) — self-host and fine-tune",
      "Top open-weights coding (~80% SWE-bench); 1M context",
      "Extremely cheap — Pro & Flash tiers",
    ],
    weaknesses: [
      "You own serving, scaling, and uptime",
      "Multimodal maturity unproven",
      "Less battle-tested than hosted frontier models",
    ],
    scores: { coding: 4, reasoning: 4, speed: 3, affordability: 5, multimodal: 2 },
    contextWindow: "1M tokens",
    contextTokens: 1_000_000,
    modality: "Text + vision",
    released: "Apr 2026",
    priceTier: "Open / low ($)",
    specsChecked: "Jul 2026",
    updates: [
      { headline: "DeepSeek V4 released as open weights (MIT) with a 1M context", date: "2026-04-24", source: "GitHub" },
    ],
  },
];

export function getAllModels(): Model[] {
  return MODELS;
}

export function getModelBySlug(slug: string): Model | undefined {
  return MODELS.find((m) => m.slug === slug);
}
