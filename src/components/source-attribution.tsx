import type { SourceUrl } from "@/types";

function platformLabel(platform: string): string {
  return platform === "youtube" ? "YouTube" : "Reddit";
}

export function SourceAttribution({ sources }: { sources: SourceUrl[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-[#cdd5cb] dark:border-[#3A433A]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B9B8E] mb-4">
        Original {sources.length === 1 ? "Source" : "Sources"}
      </p>
      <div className="space-y-3">
        {sources.map((source, i) => (
          <div key={i}>
            <p className="text-[14px] text-[#5A5A6E] dark:text-[#A8B0A6]">
              {source.creator} on {platformLabel(source.platform)}
            </p>
            <a
              href={source.url}
              className="inline-flex items-center gap-1.5 mt-1 text-[14px] font-medium text-[#6B47A8] hover:text-[#5B3D99]
                dark:text-[#C5B3E6] dark:hover:text-[#D4C8F0] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Original <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
