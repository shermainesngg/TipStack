import { DiagramFrame } from "./frame";
import {
  TONE_SVG_FILL,
  TONE_SVG_STROKE,
  TONE_SVG_TEXT,
  toTone,
  type Tone,
} from "./tokens";

export type LoopNode = {
  n?: string; // step number, e.g. "01"
  tag?: string; // short label inside the node, e.g. "PLAN"
  label?: string; // descriptive label outside the node
  tone?: Tone;
};

const CX = 180;
const CY = 165;
const R = 105;
const NODE_R = 32;
const LABEL_R = R + NODE_R + 16;

const rad = (deg: number) => (deg * Math.PI) / 180;
const at = (deg: number, radius: number): [number, number] => [
  CX + radius * Math.cos(rad(deg)),
  CY + radius * Math.sin(rad(deg)),
];
const f = (x: number) => Math.round(x * 100) / 100;

/**
 * A cyclic process diagram: N phase-nodes evenly spaced around a circle with
 * clockwise connecting arrows colored by the source phase, plus a center note.
 */
export function DiagramLoop({
  nodes,
  center,
  caption,
}: {
  nodes: LoopNode[];
  center?: string[];
  caption?: string;
}) {
  const N = Math.max(nodes.length, 2);
  const seg = 360 / N;
  // Angular gap so arcs start/end just outside each node circle.
  const gap = (Math.asin(NODE_R / R) * 180) / Math.PI + 7;

  return (
    <DiagramFrame caption={caption}>
      <svg
        viewBox="0 0 360 310"
        role="img"
        className="mx-auto block w-full max-w-[380px] overflow-visible"
      >
        {/* connecting arcs + arrowheads */}
        {nodes.map((node, i) => {
          const tone = toTone(node.tone);
          const a1 = -90 + i * seg + gap;
          const a2 = -90 + (i + 1) * seg - gap;
          const [sx, sy] = at(a1, R);
          const [ex, ey] = at(a2, R);
          // tangent (clockwise) at the arrow end
          const dx = -Math.sin(rad(a2));
          const dy = Math.cos(rad(a2));
          const bx = ex - dx * 9;
          const by = ey - dy * 9;
          const px = -dy * 4.5;
          const py = dx * 4.5;
          return (
            <g key={`arc-${i}`}>
              <path
                d={`M ${f(sx)} ${f(sy)} A ${R} ${R} 0 0 1 ${f(ex)} ${f(ey)}`}
                fill="none"
                strokeWidth={2}
                className={TONE_SVG_STROKE[tone]}
              />
              <polygon
                points={`${f(ex)},${f(ey)} ${f(bx + px)},${f(by + py)} ${f(
                  bx - px
                )},${f(by - py)}`}
                className={TONE_SVG_TEXT[tone]}
              />
            </g>
          );
        })}

        {/* nodes */}
        {nodes.map((node, i) => {
          const tone = toTone(node.tone);
          const angle = -90 + i * seg;
          const [nx, ny] = at(angle, R);
          const [lx, ly] = at(angle, LABEL_R);
          const above = Math.sin(rad(angle)) < -0.3;
          return (
            <g key={`node-${i}`}>
              <circle
                cx={f(nx)}
                cy={f(ny)}
                r={NODE_R}
                strokeWidth={2}
                className={`${TONE_SVG_FILL[tone]} ${TONE_SVG_STROKE[tone]}`}
              />
              {node.n && (
                <text
                  x={f(nx)}
                  y={f(ny) - 3}
                  textAnchor="middle"
                  className={`font-mono ${TONE_SVG_TEXT[tone]}`}
                  fontSize="13"
                  fontWeight="600"
                >
                  {node.n}
                </text>
              )}
              {node.tag && (
                <text
                  x={f(nx)}
                  y={f(ny) + 10}
                  textAnchor="middle"
                  className={`font-mono ${TONE_SVG_TEXT[tone]}`}
                  fontSize="9"
                  letterSpacing="0.5"
                >
                  {node.tag}
                </text>
              )}
              {node.label && (
                <text
                  x={f(lx)}
                  y={f(ly)}
                  textAnchor="middle"
                  dominantBaseline={above ? "auto" : "hanging"}
                  className="fill-[#191E27] font-heading dark:fill-[#E8E9EC]"
                  fontSize="14"
                  fontWeight="600"
                >
                  {node.label}
                </text>
              )}
            </g>
          );
        })}

        {/* center note */}
        {center?.map((line, i) => (
          <text
            key={`center-${i}`}
            x={CX}
            y={CY + i * 16 - (center.length - 1) * 8}
            textAnchor="middle"
            className="fill-[#8A909C] font-mono dark:fill-[#6E7684]"
            fontSize="11"
            letterSpacing="0.4"
          >
            {line}
          </text>
        ))}
      </svg>
    </DiagramFrame>
  );
}
