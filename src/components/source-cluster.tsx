import type { SourceUrl, Platform } from "@/types";
import { PLATFORM_CHIP, PLATFORM_DOT, platformLabel } from "@/lib/platforms";

/** Dedupe by URL, preserving order. */
function uniqueSources(sources: SourceUrl[]): SourceUrl[] {
  const seen = new Set<string>();
  const out: SourceUrl[] = [];
  for (const s of sources) {
    const key = s.url || `${s.platform}:${s.creator}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** Human label for one source: the creator/outlet, falling back to the domain, then platform. */
function sourceLabel(s: SourceUrl): string {
  if (s.creator && s.creator.trim()) return s.creator.trim();
  try {
    return new URL(s.url).hostname.replace(/^www\./, "");
  } catch {
    return platformLabel(s.platform);
  }
}

/** Distinct platforms in appearance order. */
function distinctPlatforms(sources: SourceUrl[]): Platform[] {
  const seen = new Set<Platform>();
  const out: Platform[] = [];
  for (const s of sources) {
    if (seen.has(s.platform)) continue;
    seen.add(s.platform);
    out.push(s.platform);
  }
  return out;
}

/**
 * Techmeme-style source cluster for the hero: an eyebrow count plus a wrapped
 * row of clickable, platform-tinted outlet links. Not nested inside a Link.
 */
export function SourceCluster({
  sources,
  max = 8,
}: {
  sources: SourceUrl[];
  max?: number;
}) {
  const unique = uniqueSources(sources);
  if (unique.length === 0) return null;

  const shown = unique.slice(0, max);
  const overflow = unique.length - shown.length;

  return (
    <div className="mt-5">
      <div className="mb-2 text-[11px] font-heading font-semibold uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#C4A77E]">
        {unique.length} {unique.length === 1 ? "source" : "sources"}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((s, i) => (
          <a
            key={`${s.url}-${i}`}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md tracking-wide transition-opacity hover:opacity-75 ${PLATFORM_CHIP[s.platform] ?? ""}`}
          >
            <span className="opacity-70">{platformLabel(s.platform)}</span>
            <span className="max-w-[14ch] truncate">{sourceLabel(s)}</span>
          </a>
        ))}
        {overflow > 0 && (
          <span className="text-[12px] text-[#9B9B8E] tracking-wide">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact, text-only source summary for dense list rows. Renders distinct
 * platform dots + labels and a source count. Contains no anchors, so it is
 * safe to nest inside a Link-wrapped row.
 */
export function SourceLine({ sources }: { sources: SourceUrl[] }) {
  const unique = uniqueSources(sources);
  if (unique.length === 0) return null;

  const platforms = distinctPlatforms(unique).slice(0, 3);

  return (
    <span className="inline-flex items-center gap-1.5">
      {platforms.map((p) => (
        <span key={p} className="inline-flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOT[p] ?? "bg-[#9B9B8E]"}`} />
          <span>{platformLabel(p)}</span>
        </span>
      ))}
      {unique.length > 1 && (
        <span className="text-[#9B9B8E]">
          · {unique.length} sources
        </span>
      )}
    </span>
  );
}
