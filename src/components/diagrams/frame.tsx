import type { ReactNode } from "react";
import { SURFACE } from "./tokens";

/**
 * Shared container for every diagram: a warm-paper card with an optional
 * monospace caption underneath. `scroll` enables horizontal scroll for wide
 * diagrams so the page body never scrolls sideways.
 */
export function DiagramFrame({
  children,
  caption,
  scroll = false,
}: {
  children: ReactNode;
  caption?: string;
  scroll?: boolean;
}) {
  return (
    <figure className="my-8">
      <div
        className={`rounded-xl border ${SURFACE.border} ${SURFACE.frame} p-5 ${
          scroll ? "overflow-x-auto" : ""
        }`}
      >
        {children}
      </div>
      {caption && (
        <figcaption
          className={`mt-3 text-center font-mono text-[11px] leading-snug tracking-wide ${SURFACE.faint}`}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function DiagramError({ message }: { message?: string }) {
  return (
    <div
      className={`my-8 rounded-xl border ${SURFACE.border} ${SURFACE.frame} p-5 text-center font-mono text-[12px] ${SURFACE.faint}`}
    >
      {message ?? "Diagram could not be rendered."}
    </div>
  );
}
