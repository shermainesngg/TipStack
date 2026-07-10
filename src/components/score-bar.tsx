"use client";

import { motion } from "framer-motion";

/**
 * A small animated capability bar (value out of `max`). Fills on scroll-into-view.
 * `color` is a Tailwind bg class (e.g. a maker's accent dot color).
 */
export function ScoreBar({
  value,
  max = 5,
  color,
  animateOn = "view",
}: {
  value: number;
  max?: number;
  color: string;
  animateOn?: "view" | "mount";
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const fill = { width: `${pct}%` };

  return (
    <div className="h-1.5 w-full rounded-full bg-[#dde4db] dark:bg-[#2A322A] overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        {...(animateOn === "view"
          ? { whileInView: fill, viewport: { once: true, amount: 0.6 } }
          : { animate: fill })}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}
