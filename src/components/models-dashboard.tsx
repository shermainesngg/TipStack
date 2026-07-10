"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MAKERS,
  TIER_LABEL,
  SCORE_DIMS,
  type Model,
  type MakerKey,
} from "@/lib/models";
import { ScoreBar } from "./score-bar";

const MAX_COMPARE = 4;

// ─── small shared bits ──────────────────────────────────────────────────────

function MakerEyebrow({ model }: { model: Model }) {
  const maker = MAKERS[model.maker];
  return (
    <div className="flex items-center gap-2 flex-wrap">
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
  );
}

function SpecLine({ model }: { model: Model }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#6E6E7E] dark:text-[#8FA090] tracking-wide">
      <span>{model.contextWindow} context</span>
      <span className="text-[#c3cbc0] dark:text-[#3A433A]">·</span>
      <span>{model.priceTier}</span>
    </div>
  );
}

function MiniScores({ model }: { model: Model }) {
  const maker = MAKERS[model.maker];
  return (
    <div className="space-y-1.5">
      {SCORE_DIMS.map((d) => (
        <div key={d.key} className="flex items-center gap-2.5">
          <span className="w-[76px] shrink-0 text-[11px] text-[#6E6E7E] dark:text-[#8FA090] tracking-wide">
            {d.label}
          </span>
          <ScoreBar value={model.scores[d.key]} color={maker.dot} animateOn="mount" />
        </div>
      ))}
    </div>
  );
}

// ─── spotlight (static) ─────────────────────────────────────────────────────

function SpotlightCard({ model }: { model: Model }) {
  return (
    <Link href={`/models/${model.slug}`} className="block group">
      <article className="rounded-2xl bg-[#fafcfa] dark:bg-[#1E241E] p-6 sm:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.04),0_18px_44px_rgba(0,0,0,0.09)] dark:shadow-none dark:border dark:border-[#3A433A] transition-shadow duration-300 group-hover:shadow-[0_4px_14px_rgba(0,0,0,0.06),0_22px_54px_rgba(0,0,0,0.11)]">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className="text-[11px] font-heading font-semibold uppercase tracking-[0.14em] text-[#8B6E4E] dark:text-[#C4A77E]">
            Spotlight
          </span>
          <MakerEyebrow model={model} />
        </div>
        <div className="grid md:grid-cols-[1.3fr_1fr] gap-6 items-center">
          <div>
            <h2 className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.1] [font-size:clamp(1.6rem,2.4vw+0.6rem,2.15rem)] group-hover:opacity-80 transition-opacity">
              {model.name}
            </h2>
            <p className="mt-3 max-w-[52ch] text-[15.5px] leading-[1.6] text-[#3D3D50] dark:text-[#C8D0C6]">
              {model.tagline}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <SpecLine model={model} />
              <span className="text-[13px] font-medium text-[#6B47A8] dark:text-[#C5B3E6] whitespace-nowrap group-hover:underline underline-offset-4">
                Explore →
              </span>
            </div>
          </div>
          <MiniScores model={model} />
        </div>
      </article>
    </Link>
  );
}

// ─── interactive grid card ──────────────────────────────────────────────────

function DashCard({
  model,
  selected,
  onToggle,
  disabled,
}: {
  model: Model;
  selected: boolean;
  onToggle: (slug: string) => void;
  disabled: boolean;
}) {
  const maker = MAKERS[model.maker];
  return (
    <article
      className={`h-full rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-200 ${maker.tint} ${maker.darkTint} dark:border dark:border-[#3A433A] ${
        selected ? `ring-2 ${maker.ring} ring-offset-2 ring-offset-[#EDF2EC] dark:ring-offset-[#161B16]` : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <MakerEyebrow model={model} />
          {model.restricted && (
            <span className="inline-flex w-fit items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md text-[#8B6E4E] bg-[#efe7db] dark:text-[#C4A77E] dark:bg-[#2E2818]">
              Restricted access
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggle(model.slug)}
          disabled={disabled && !selected}
          aria-pressed={selected}
          className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full tracking-wide transition-colors ${
            selected
              ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#1A1A2E]"
              : disabled
                ? "bg-transparent text-[#c3cbc0] dark:text-[#3A433A] cursor-not-allowed"
                : "bg-[#fafcfa]/70 text-[#5A5A6E] hover:text-[#1A1A2E] dark:bg-[#161B16]/40 dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC]"
          }`}
        >
          {selected ? "✓ Comparing" : "+ Compare"}
        </button>
      </div>

      <Link href={`/models/${model.slug}`} className="block group mt-3">
        <h3 className="font-heading font-bold text-[19px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] group-hover:opacity-80 transition-opacity">
          {model.name}
        </h3>
      </Link>
      <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
        {model.tagline}
      </p>

      <div className="mt-4">
        <MiniScores model={model} />
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <SpecLine model={model} />
        <Link
          href={`/models/${model.slug}`}
          className="text-[12px] font-medium text-[#6B47A8] dark:text-[#C5B3E6] whitespace-nowrap hover:underline underline-offset-4"
        >
          Details →
        </Link>
      </div>
    </article>
  );
}

// ─── compare overlay ────────────────────────────────────────────────────────

function CompareTable({ models }: { models: Model[] }) {
  const maxContext = Math.max(...models.map((m) => m.contextTokens));
  const cols = `minmax(92px,110px) repeat(${models.length}, minmax(140px,1fr))`;

  const cell = "pb-3 border-b border-[#e0e7de] dark:border-[#2A322A]";
  const rowLabel = `${cell} text-[12px] font-medium text-[#6E6E7E] dark:text-[#8FA090] tracking-wide self-center`;

  type Row = { key: string; label: string; render: (m: Model) => React.ReactNode };
  const rows: Row[] = [
    {
      key: "context",
      label: "Context",
      render: (m) => (
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium text-[#1A1A2E] dark:text-[#EDF2EC]">
            {m.contextWindow}
          </span>
          <ScoreBar value={m.contextTokens} max={maxContext} color={MAKERS[m.maker].dot} animateOn="mount" />
        </div>
      ),
    },
    { key: "price", label: "Pricing", render: (m) => <span className="text-[13px] text-[#3D3D50] dark:text-[#C8D0C6]">{m.priceTier}</span> },
    { key: "released", label: "Released", render: (m) => <span className="text-[13px] text-[#3D3D50] dark:text-[#C8D0C6]">{m.released}</span> },
    { key: "modality", label: "Modality", render: (m) => <span className="text-[13px] text-[#3D3D50] dark:text-[#C8D0C6]">{m.modality}</span> },
    ...SCORE_DIMS.map((d) => ({
      key: d.key,
      label: d.label,
      render: (m: Model) => (
        <div className="flex items-center gap-2">
          <ScoreBar value={m.scores[d.key]} color={MAKERS[m.maker].dot} animateOn="mount" />
          <span className="w-7 shrink-0 text-[11px] text-[#9B9B8E] tabular-nums">{m.scores[d.key]}/5</span>
        </div>
      ),
    })),
    {
      key: "bestfor",
      label: "Best for",
      render: (m) => (
        <ul className="space-y-1">
          {m.bestFor.slice(0, 2).map((b) => (
            <li key={b} className="text-[12.5px] leading-[1.45] text-[#3D3D50] dark:text-[#C8D0C6]">
              {b}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="grid gap-x-4 gap-y-3 min-w-[440px]" style={{ gridTemplateColumns: cols }}>
        {/* header */}
        <div className="pb-3 border-b-2 border-[#dde4db] dark:border-[#3A433A]" />
        {models.map((m) => (
          <div key={m.slug} className="pb-3 border-b-2 border-[#dde4db] dark:border-[#3A433A]">
            <div className="font-heading font-bold text-[15px] text-[#1A1A2E] dark:text-[#EDF2EC] leading-tight">
              {m.name}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6E6E7E] dark:text-[#8FA090]">
              <span className={`h-1.5 w-1.5 rounded-full ${MAKERS[m.maker].dot}`} />
              {MAKERS[m.maker].label}
            </div>
          </div>
        ))}

        {/* rows */}
        {rows.map((row) => (
          <Fragment key={row.key}>
            <div className={rowLabel}>{row.label}</div>
            {models.map((m) => (
              <div key={m.slug + row.key} className={cell}>
                {row.render(m)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function CompareOverlay({
  models,
  onClose,
}: {
  models: Model[];
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full sm:max-w-[880px] max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#EDF2EC] dark:bg-[#161B16] p-5 sm:p-7 shadow-[0_-8px_40px_rgba(0,0,0,0.18)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)] dark:border dark:border-[#3A433A]"
        initial={{ y: 60, opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-heading font-extrabold text-[#1A1A2E] dark:text-[#EDF2EC] text-[1.4rem]">
            Compare {models.length} models
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A] transition-colors"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <CompareTable models={models} />
      </motion.div>
    </motion.div>
  );
}

// ─── main dashboard ─────────────────────────────────────────────────────────

export function ModelsDashboard({ models }: { models: Model[] }) {
  const [makerFilter, setMakerFilter] = useState<MakerKey | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const makerOptions = useMemo(() => {
    const seen: MakerKey[] = [];
    for (const m of models) if (!seen.includes(m.maker)) seen.push(m.maker);
    return seen;
  }, [models]);

  const spotlight = models.find((m) => m.featured) ?? models[0];
  const visible =
    makerFilter === "all" ? models : models.filter((m) => m.maker === makerFilter);
  const gridModels =
    makerFilter === "all" ? visible.filter((m) => m.slug !== spotlight.slug) : visible;

  const selectedModels = selected
    .map((s) => models.find((m) => m.slug === s))
    .filter((m): m is Model => Boolean(m));

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, slug];
    });
  }

  const atCap = selected.length >= MAX_COMPARE;

  return (
    <div>
      {makerFilter === "all" && (
        <div className="mb-6">
          <SpotlightCard model={spotlight} />
        </div>
      )}

      {/* filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setMakerFilter("all")}
          className={`text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-colors ${
            makerFilter === "all"
              ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#1A1A2E]"
              : "bg-[#dde4db]/60 text-[#5A5A6E] hover:bg-[#dde4db] dark:bg-[#2A322A]/60 dark:text-[#A8B0A6]"
          }`}
        >
          All labs
        </button>
        {makerOptions.map((mk) => (
          <button
            key={mk}
            type="button"
            onClick={() => setMakerFilter(mk)}
            className={`inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-colors ${
              makerFilter === mk
                ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#1A1A2E]"
                : "bg-[#dde4db]/60 text-[#5A5A6E] hover:bg-[#dde4db] dark:bg-[#2A322A]/60 dark:text-[#A8B0A6]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${MAKERS[mk].dot}`} />
            {MAKERS[mk].label}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-24">
        {gridModels.map((model) => (
          <DashCard
            key={model.slug}
            model={model}
            selected={selected.includes(model.slug)}
            onToggle={toggleSelect}
            disabled={atCap}
          />
        ))}
      </div>

      {/* sticky compare tray */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[640px]"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center gap-2 rounded-2xl bg-[#1A1A2E] dark:bg-[#EDF2EC] px-3 py-2.5 shadow-[0_10px_36px_rgba(0,0,0,0.25)]">
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                {selectedModels.map((m) => (
                  <span
                    key={m.slug}
                    className="inline-flex items-center gap-1 text-[12px] font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-[#2A2A3E] text-[#EDF2EC] dark:bg-[#dde4db] dark:text-[#1A1A2E]"
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => toggleSelect(m.slug)}
                      aria-label={`Remove ${m.name}`}
                      className="opacity-60 hover:opacity-100 text-[13px] leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-[12px] text-[#A8B0A6] dark:text-[#5A5A6E] hover:text-[#EDF2EC] dark:hover:text-[#1A1A2E] px-2 whitespace-nowrap transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                disabled={selected.length < 2}
                className="shrink-0 text-[13px] font-semibold px-4 py-2 rounded-full bg-[#6B47A8] text-[#fafcfa] disabled:bg-[#3A3A4E] disabled:text-[#8A8A9E] dark:disabled:bg-[#c3cbc0] dark:disabled:text-[#8FA090] transition-colors"
              >
                {selected.length < 2 ? "Pick 2+" : "Compare"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compareOpen && selectedModels.length >= 2 && (
          <CompareOverlay models={selectedModels} onClose={() => setCompareOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
