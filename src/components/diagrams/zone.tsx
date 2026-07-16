import { DiagramFrame } from "./frame";
import { SURFACE, TONE_TEXT, TONE_BG } from "./tokens";

/**
 * A single horizontal band split into a "smart zone" (good, up to `smartPct`%)
 * and a "dumb zone" (degraded), with an optional scale beneath. Used to show
 * the context-window quality cliff.
 */
export function DiagramZone({
  smartPct = 50,
  smartLabel = "SMART ZONE",
  dumbLabel = "DUMB ZONE",
  scale,
  caption,
}: {
  smartPct?: number;
  smartLabel?: string;
  dumbLabel?: string;
  scale?: string[];
  caption?: string;
}) {
  const pct = Math.min(Math.max(smartPct, 5), 95);
  return (
    <DiagramFrame caption={caption}>
      <div
        className={`flex h-[46px] overflow-hidden rounded-lg border font-mono ${SURFACE.border}`}
      >
        <div
          className={`flex items-center justify-center px-2 text-center text-[11px] font-semibold tracking-wide ${TONE_BG.valid} ${TONE_TEXT.valid}`}
          style={{ flexBasis: `${pct}%`, flexGrow: 0, flexShrink: 0 }}
        >
          {smartLabel}
        </div>
        <div
          className={`flex flex-1 items-center justify-center px-2 text-center text-[11px] font-semibold tracking-wide ${TONE_BG.impl} ${TONE_TEXT.impl}`}
        >
          {dumbLabel}
        </div>
      </div>
      {scale && scale.length > 0 && (
        <div
          className={`mt-1.5 flex justify-between font-mono text-[10px] ${SURFACE.faint}`}
        >
          {scale.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      )}
    </DiagramFrame>
  );
}
