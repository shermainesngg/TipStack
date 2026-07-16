/**
 * Blueprint diagram palette — the design language for TipStack article diagrams.
 *
 * This is a DELIBERATE departure from the sage `tipstack-ui` site palette: an
 * "engineering field manual" look (indigo / ember / teal on warm paper) used
 * ONLY inside article diagrams. See src/components/diagrams/README.md.
 *
 * All values are Tailwind arbitrary classes with `dark:` variants so diagrams
 * are theme-aware. Fonts: font-mono (JetBrains) for the instrument vocabulary
 * (skill names, step numbers, labels), font-heading (Bricolage) for node titles.
 */

export type Tone = "plan" | "impl" | "valid" | "red" | "neutral";

/** Surfaces + neutrals (Tailwind class fragments). */
export const SURFACE = {
  /** Outer diagram card (warm paper). */
  frame: "bg-[#F5F3EE] dark:bg-[#12151B]",
  /** Inner panels / step cards. */
  panel: "bg-[#FBFAF6] dark:bg-[#1A1F28]",
  border: "border-[#E2DED4] dark:border-[#2A303B]",
  ink: "text-[#191E27] dark:text-[#E8E9EC]",
  muted: "text-[#5C6472] dark:text-[#9AA1AE]",
  faint: "text-[#8A909C] dark:text-[#6E7684]",
  shadow:
    "shadow-[0_1px_2px_rgba(25,30,39,0.05),0_8px_28px_-18px_rgba(25,30,39,0.28)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_30px_-18px_rgba(0,0,0,0.7)]",
} as const;

/** Foreground (text/label) color per tone. */
export const TONE_TEXT: Record<Tone, string> = {
  plan: "text-[#3554B0] dark:text-[#8AA1E8]",
  impl: "text-[#C2560E] dark:text-[#F0955A]",
  valid: "text-[#0F766E] dark:text-[#4FBEB2]",
  red: "text-[#B42318] dark:text-[#F4A79F]",
  neutral: "text-[#5C6472] dark:text-[#9AA1AE]",
};

/** Tinted background per tone. */
export const TONE_BG: Record<Tone, string> = {
  plan: "bg-[#eaeefb] dark:bg-[#1c2440]",
  impl: "bg-[#fbeee3] dark:bg-[#2e2015]",
  valid: "bg-[#e5f2f0] dark:bg-[#133029]",
  red: "bg-[#fdecea] dark:bg-[#2c1512]",
  neutral: "bg-[#eef0f0] dark:bg-[#1b2028]",
};

/** Border per tone. */
export const TONE_BORDER: Record<Tone, string> = {
  plan: "border-[#3554B0] dark:border-[#8AA1E8]",
  impl: "border-[#C2560E] dark:border-[#F0955A]",
  valid: "border-[#0F766E] dark:border-[#4FBEB2]",
  red: "border-[#B42318] dark:border-[#5e2b26]",
  neutral: "border-[#D3CEC2] dark:border-[#363E4B]",
};

/** SVG fill for tinted node bodies. */
export const TONE_SVG_FILL: Record<Tone, string> = {
  plan: "fill-[#eaeefb] dark:fill-[#1c2440]",
  impl: "fill-[#fbeee3] dark:fill-[#2e2015]",
  valid: "fill-[#e5f2f0] dark:fill-[#133029]",
  red: "fill-[#fdecea] dark:fill-[#2c1512]",
  neutral: "fill-[#eef0f0] dark:fill-[#1b2028]",
};

/** SVG stroke per tone. */
export const TONE_SVG_STROKE: Record<Tone, string> = {
  plan: "stroke-[#3554B0] dark:stroke-[#8AA1E8]",
  impl: "stroke-[#C2560E] dark:stroke-[#F0955A]",
  valid: "stroke-[#0F766E] dark:stroke-[#4FBEB2]",
  red: "stroke-[#B42318] dark:stroke-[#5e2b26]",
  neutral: "stroke-[#5A5A6E] dark:stroke-[#6E7684]",
};

/** SVG text fill per tone. */
export const TONE_SVG_TEXT: Record<Tone, string> = {
  plan: "fill-[#3554B0] dark:fill-[#8AA1E8]",
  impl: "fill-[#C2560E] dark:fill-[#F0955A]",
  valid: "fill-[#0F766E] dark:fill-[#4FBEB2]",
  red: "fill-[#B42318] dark:fill-[#F4A79F]",
  neutral: "fill-[#5C6472] dark:fill-[#9AA1AE]",
};

/** Coerce arbitrary strings from JSON into a known tone. */
export function toTone(value: unknown): Tone {
  return value === "plan" ||
    value === "impl" ||
    value === "valid" ||
    value === "red" ||
    value === "neutral"
    ? value
    : "neutral";
}
