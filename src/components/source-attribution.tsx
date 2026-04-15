import type { SourceUrl } from "@/types";

function platformLabel(platform: string): string {
  return platform === "youtube" ? "YouTube" : "Reddit";
}

export function SourceAttribution({ sources }: { sources: SourceUrl[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-12 space-y-4">
      <p className="text-sm font-medium text-[#7C8590]">
        Original {sources.length === 1 ? "Source" : "Sources"}
      </p>
      {sources.map((source, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]
            dark:bg-[#1E241E] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
        >
          <p className="text-sm text-[#7C8590]">
            by @{source.creator} on {platformLabel(source.platform)}
          </p>
          <a
            href={source.url}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#6B47A8] hover:text-[#5B3D99]
              dark:text-[#C5B3E6] dark:hover:text-[#D4C8F0]"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Original <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      ))}
    </div>
  );
}
