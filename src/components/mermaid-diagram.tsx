"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#e8efe7",
          primaryTextColor: "#1A1A2E",
          primaryBorderColor: "#9B9B8E",
          lineColor: "#5A5A6E",
          secondaryColor: "#f0e8d4",
          tertiaryColor: "#f0dbd8",
          fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
          fontSize: "14px",
        },
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      try {
        const { svg: rendered } = await mermaid.render(id, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setSvg("");
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (!svg) {
    return (
      <div className="my-8 rounded-xl bg-[#e8efe7] dark:bg-[#1E2A1E] p-5 text-center text-[13px] text-[#9B9B8E]">
        Loading diagram...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-8 rounded-xl bg-[#fafcfa] dark:bg-[#1E241E] p-5 overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
