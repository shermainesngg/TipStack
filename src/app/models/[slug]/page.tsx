import Link from "next/link";
import { notFound } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import type { Metadata } from "next";
import {
  getAllModels,
  getModelBySlug,
  MAKERS,
  TIER_LABEL,
  SCORE_DIMS,
  type Model,
} from "@/lib/models";
import { getModelUpdates, type ModelUpdateRow } from "@/lib/supabase/queries";
import { ScoreBar } from "@/components/score-bar";

export function generateStaticParams() {
  return getAllModels().map((m) => ({ slug: m.slug }));
}

/** Live updates from feed items tagged to this model; [] if none/unconfigured. */
async function getLiveUpdates(slug: string): Promise<ModelUpdateRow[]> {
  "use cache";
  cacheTag("feed");
  cacheLife("hours");
  try {
    return await getModelUpdates(slug, 6);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return {};
  return {
    title: `${model.name} — TipStack Models`,
    description: model.tagline,
  };
}

function formatUpdateDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProsConsList({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "strength" | "weakness";
}) {
  const isStrength = variant === "strength";
  const bg = isStrength
    ? "bg-[#eef6f0] dark:bg-[#17251b]"
    : "bg-[#f7f0ec] dark:bg-[#241c17]";
  const marker = isStrength ? "text-[#2D6040] dark:text-[#7EBE8E]" : "text-[#8B5E3C] dark:text-[#D4A87A]";
  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${bg}`}>
      <h3 className="font-heading font-bold text-[13px] uppercase tracking-[0.1em] text-[#1A1A2E] dark:text-[#EDF2EC] mb-3">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-[14.5px] leading-[1.55] text-[#3D3D50] dark:text-[#C8D0C6]"
          >
            <span className={`shrink-0 font-semibold ${marker}`} aria-hidden>
              {isStrength ? "+" : "–"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fafcfa] dark:bg-[#1E241E] px-3.5 py-2.5 dark:border dark:border-[#3A433A]">
      <div className="text-[10.5px] font-heading font-semibold uppercase tracking-[0.1em] text-[#9B9B8E] dark:text-[#8FA090]">
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-medium text-[#1A1A2E] dark:text-[#EDF2EC]">
        {value}
      </div>
    </div>
  );
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model: Model | undefined = getModelBySlug(slug);
  if (!model) notFound();

  const maker = MAKERS[model.maker];

  // Prefer live, pipeline-fed updates; fall back to curated highlights.
  const liveUpdates = await getLiveUpdates(model.slug);
  const updates = liveUpdates.length > 0 ? liveUpdates : model.updates;
  const updatesAreLive = liveUpdates.length > 0;

  return (
    <div className="pt-8 pb-20">
      <div className="max-w-[720px]">
        <Link
          href="/models"
          className="inline-flex items-center gap-1 text-[13px] text-[#9B9B8E] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors"
        >
          ← Models
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md tracking-wide ${maker.chip}`}
            >
              {maker.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6E6E7E] dark:text-[#A8B0A6]">
              <span className={`h-1.5 w-1.5 rounded-full ${maker.dot}`} />
              {TIER_LABEL[model.tier]}
            </span>
          </div>
          <h1 className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.05] [font-size:clamp(1.9rem,3.2vw+0.6rem,2.6rem)] max-w-[20ch]">
            {model.name}
          </h1>
          <p className="mt-3 max-w-[60ch] text-[16.5px] leading-[1.6] text-[#3D3D50] dark:text-[#C8D0C6]">
            {model.tagline}
          </p>
        </header>

        {model.restricted && (
          <div className="mt-5 rounded-xl bg-[#efe7db] dark:bg-[#2E2818] px-4 py-3 text-[13px] leading-[1.55] text-[#7B6230] dark:text-[#D4B875]">
            <span className="font-semibold">Restricted access.</span>{" "}
            {model.access}. Listed for awareness — not generally available.
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <SpecChip label="Context" value={model.contextWindow} />
          <SpecChip label="Modality" value={model.modality} />
          <SpecChip label="Released" value={model.released} />
          <SpecChip label="Pricing" value={model.priceTier} />
        </div>

        {/* ── Capabilities at a glance ── */}
        <section className="mt-8">
          <h2 className="font-heading font-bold text-[13px] uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#C4A77E] mb-3">
            Capabilities at a glance
          </h2>
          <div className="rounded-2xl bg-[#fafcfa] dark:bg-[#1E241E] p-5 sm:p-6 dark:border dark:border-[#3A433A] grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
            {SCORE_DIMS.map((d) => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="w-[92px] shrink-0 text-[12.5px] text-[#5A5A6E] dark:text-[#A8B0A6] tracking-wide">
                  {d.label}
                </span>
                <ScoreBar value={model.scores[d.key]} color={maker.dot} />
                <span className="w-7 shrink-0 text-[11px] text-[#9B9B8E] tabular-nums text-right">
                  {model.scores[d.key]}/5
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] text-[#9B9B8E]">
            Editorial estimates for quick comparison — not benchmark scores.
          </p>
        </section>

        {/* ── The rundown (stable editorial) ── */}
        <section className="mt-9">
          <h2 className="font-heading font-bold text-[13px] uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#C4A77E] mb-3">
            The rundown
          </h2>
          <p className="text-[16.5px] leading-[1.75] text-[#3D3D50] dark:text-[#C8D0C6]">
            {model.rundown}
          </p>
        </section>

        {/* ── When to reach for it ── */}
        <section className="mt-9">
          <h2 className="font-heading font-bold text-[13px] uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#C4A77E] mb-3">
            When to reach for it
          </h2>
          <div className="rounded-2xl bg-[#f4f8f3] dark:bg-[#1a201a] p-5 sm:p-6">
            <ul className="space-y-2.5">
              {model.bestFor.map((b) => (
                <li
                  key={b}
                  className="flex gap-2.5 text-[15.5px] leading-[1.55] text-[#3D3D50] dark:text-[#C8D0C6]"
                >
                  <span className={`mt-[0.55em] h-1.5 w-1.5 rounded-full shrink-0 ${maker.dot}`} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Strengths / weaknesses ── */}
        <section className="mt-9 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProsConsList title="Strengths" items={model.strengths} variant="strength" />
          <ProsConsList title="Watch out for" items={model.weaknesses} variant="weakness" />
        </section>

        {/* ── Latest updates (pipeline-fed volatile half) ── */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="font-heading font-bold text-[13px] uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#C4A77E]">
              Latest updates
            </h2>
            <span className="text-[12px] text-[#9B9B8E]">
              {updatesAreLive ? "from the feed" : "curated highlights"}
            </span>
          </div>
          <div className="space-y-1">
            {updates.map((u) => (
              <div
                key={u.headline}
                className="rounded-xl px-3 py-3 -mx-3 transition-colors hover:bg-[#fafcfa] dark:hover:bg-[#1E241E]"
              >
                <p className="font-heading font-semibold text-[15.5px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC]">
                  {u.headline}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#6E6E7E] dark:text-[#8FA090] tracking-wide">
                  <span>{u.source}</span>
                  <span className="text-[#9B9B8E]">·</span>
                  <span className="text-[#9B9B8E]">{formatUpdateDate(u.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Data-model note ── */}
        <p className="mt-12 border-t border-[#dde4db] dark:border-[#3A433A] pt-5 text-[12.5px] leading-[1.65] text-[#9B9B8E]">
          The rundown, strengths, and specs are curated editorial content (edited
          rarely, specs checked {model.specsChecked}). “Latest updates”{" "}
          {updatesAreLive
            ? "are drawn automatically from feed items tagged to this model."
            : "fall back to curated highlights until tagged feed items exist for this model."}
        </p>
      </div>
    </div>
  );
}
