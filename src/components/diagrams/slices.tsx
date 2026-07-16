import { DiagramFrame } from "./frame";
import { SURFACE, TONE_TEXT, TONE_BG, TONE_BORDER } from "./tokens";

type Highlight = (row: number, col: number) => "impl" | "valid" | null;

function SliceBoard({
  title,
  sub,
  note,
  layers,
  cols,
  highlight,
}: {
  title: string;
  sub: string;
  note: string;
  layers: string[];
  cols: number;
  highlight: Highlight;
}) {
  const colList = Array.from({ length: cols });
  return (
    <div
      className={`rounded-xl border p-4 ${SURFACE.panel} ${SURFACE.border} ${SURFACE.shadow}`}
    >
      <h4 className={`font-heading text-[0.95rem] font-semibold ${SURFACE.ink}`}>
        {title}
      </h4>
      <p
        className={`mb-3 font-mono text-[10px] uppercase tracking-[0.06em] ${SURFACE.faint}`}
      >
        {sub}
      </p>
      <div className="grid gap-[5px]">
        {layers.map((layer, r) => (
          <div
            key={r}
            className="grid gap-[5px]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {colList.map((_, c) => {
              const tone = highlight(r, c);
              const cls = tone
                ? `${TONE_BG[tone]} ${TONE_BORDER[tone]} ${TONE_TEXT[tone]}`
                : `bg-[#F5F3EE] dark:bg-[#12151B] border-[#E2DED4] dark:border-[#2A303B] ${SURFACE.faint}`;
              return (
                <span
                  key={c}
                  className={`rounded-[5px] border px-1 py-[7px] text-center font-mono text-[10px] ${cls}`}
                >
                  {layer}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className={`mt-3 text-[13px] leading-snug ${SURFACE.muted}`}>{note}</p>
    </div>
  );
}

/**
 * Horizontal-layers vs. vertical-slices comparison. Two mini boards of
 * layers × columns cells: the first highlights one full layer (build-by-layer),
 * the second highlights one column across every layer (a shippable slice).
 */
export function DiagramSlices({
  layers = ["DB", "API", "UI"],
  cols = 3,
  caption,
}: {
  layers?: string[];
  cols?: number;
  caption?: string;
}) {
  return (
    <DiagramFrame caption={caption}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SliceBoard
          title="Horizontal layers"
          sub="Feedback arrives last"
          note="Build one whole layer at a time. Nothing runs end-to-end until the last step."
          layers={layers}
          cols={cols}
          highlight={(r) => (r === 0 ? "impl" : null)}
        />
        <SliceBoard
          title="Vertical slices"
          sub="Feedback every slice"
          note="Each slice crosses all layers and ships something you can see and test."
          layers={layers}
          cols={cols}
          highlight={(_r, c) => (c === 0 ? "valid" : null)}
        />
      </div>
    </DiagramFrame>
  );
}
