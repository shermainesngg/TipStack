import { DiagramFrame } from "./frame";
import { SURFACE, TONE_TEXT, TONE_BG, TONE_BORDER, toTone } from "./tokens";

export type PipelineStep = {
  // card variant
  phase?: string;
  cmd?: string;
  role?: string;
  // chip variant
  label?: string;
  tone?: string;
};

/**
 * A left-to-right sequence of steps joined by arrows.
 *  - variant "card": labeled step cards (phase eyebrow / command / role).
 *  - variant "chip": compact colored chips (e.g. a red→green→refactor cycle).
 * `loop: true` adds a trailing ↺ back to the start.
 */
export function DiagramPipeline({
  steps,
  variant = "card",
  loop = false,
  caption,
}: {
  steps: PipelineStep[];
  variant?: "card" | "chip";
  loop?: boolean;
  caption?: string;
}) {
  const arrow = (key: string, glyph = "→") => (
    <span key={key} className={`shrink-0 font-mono text-[1.1rem] ${SURFACE.faint}`}>
      {glyph}
    </span>
  );

  if (variant === "chip") {
    return (
      <DiagramFrame caption={caption}>
        <div className="flex flex-wrap items-center gap-2.5">
          {steps.map((step, i) => {
            const tone = toTone(step.tone);
            const nodes = [
              <span
                key={`chip-${i}`}
                className={`rounded-lg border px-3.5 py-2 font-mono text-[13px] font-semibold ${TONE_BG[tone]} ${TONE_BORDER[tone]} ${TONE_TEXT[tone]}`}
              >
                {step.label}
              </span>,
            ];
            if (i < steps.length - 1) nodes.push(arrow(`a-${i}`));
            else if (loop) nodes.push(arrow(`a-${i}`, "↺"));
            return nodes;
          })}
        </div>
      </DiagramFrame>
    );
  }

  return (
    <DiagramFrame caption={caption} scroll>
      <div className="flex min-w-min items-stretch gap-2 py-1">
        {steps.map((step, i) => {
          const tone = toTone(step.tone);
          const nodes = [
            <div
              key={`card-${i}`}
              className={`flex min-w-[124px] flex-1 flex-col gap-1 rounded-[10px] border p-3 ${SURFACE.panel} ${SURFACE.border} ${SURFACE.shadow}`}
            >
              {step.phase && (
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.1em] ${TONE_TEXT[tone]}`}
                >
                  {step.phase}
                </span>
              )}
              {step.cmd && (
                <span className={`font-mono text-[13px] font-semibold ${SURFACE.ink}`}>
                  {step.cmd}
                </span>
              )}
              {step.role && (
                <span className={`text-[13px] leading-snug ${SURFACE.muted}`}>
                  {step.role}
                </span>
              )}
            </div>,
          ];
          if (i < steps.length - 1) nodes.push(arrow(`a-${i}`));
          else if (loop) nodes.push(arrow(`a-${i}`, "↺"));
          return nodes;
        })}
      </div>
    </DiagramFrame>
  );
}
