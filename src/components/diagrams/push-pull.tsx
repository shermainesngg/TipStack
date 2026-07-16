import { DiagramFrame } from "./frame";
import { SURFACE, TONE_TEXT, TONE_BG, toTone } from "./tokens";

export type PushPullRow = {
  badge: string; // e.g. "Push" / "Pull"
  token: string; // e.g. "CLAUDE.md" / "skills"
  desc: string;
  tone?: string;
};

/**
 * Stacked rows contrasting delivery mechanisms (e.g. push via CLAUDE.md vs.
 * pull via skills). Each row: a tinted badge + a mono token, then a description.
 */
export function DiagramPushPull({
  rows,
  caption,
}: {
  rows: PushPullRow[];
  caption?: string;
}) {
  return (
    <DiagramFrame caption={caption}>
      <div className="grid gap-2.5">
        {rows.map((row, i) => {
          const tone = toTone(row.tone);
          return (
            <div
              key={i}
              className={`grid items-center gap-4 rounded-[10px] border p-4 sm:grid-cols-[160px_1fr] ${SURFACE.panel} ${SURFACE.border} ${SURFACE.shadow}`}
            >
              <div className="flex flex-col gap-1.5">
                <span
                  className={`w-fit rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${TONE_BG[tone]} ${TONE_TEXT[tone]}`}
                >
                  {row.badge}
                </span>
                <span className={`font-mono text-[14px] font-semibold ${SURFACE.ink}`}>
                  {row.token}
                </span>
              </div>
              <p className={`text-[14px] leading-relaxed ${SURFACE.muted}`}>
                {row.desc}
              </p>
            </div>
          );
        })}
      </div>
    </DiagramFrame>
  );
}
