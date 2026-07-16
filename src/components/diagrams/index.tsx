import { DiagramError } from "./frame";
import { DiagramLoop } from "./loop";
import { DiagramPipeline } from "./pipeline";
import { DiagramSlices } from "./slices";
import { DiagramZone } from "./zone";
import { DiagramPushPull } from "./push-pull";

/**
 * Renders a diagram from a fenced ```diagram code block in article markdown.
 * The fence body is JSON with a `type` discriminator. Parsing is total: any
 * malformed or unknown config renders a quiet fallback rather than throwing.
 * Values are placed as escaped text/SVG nodes — never dangerouslySetInnerHTML —
 * so untrusted pipeline content can't inject markup. See ./README.md.
 */
export function Diagram({ source }: { source: string }) {
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(source);
  } catch {
    return <DiagramError message="Diagram config is not valid JSON." />;
  }

  const caption = typeof config.caption === "string" ? config.caption : undefined;

  switch (config.type) {
    case "loop":
      return (
        <DiagramLoop
          nodes={Array.isArray(config.nodes) ? config.nodes : []}
          center={Array.isArray(config.center) ? (config.center as string[]) : undefined}
          caption={caption}
        />
      );
    case "pipeline":
      return (
        <DiagramPipeline
          steps={Array.isArray(config.steps) ? config.steps : []}
          variant={config.variant === "chip" ? "chip" : "card"}
          loop={config.loop === true}
          caption={caption}
        />
      );
    case "slices":
      return (
        <DiagramSlices
          layers={Array.isArray(config.layers) ? (config.layers as string[]) : undefined}
          cols={typeof config.cols === "number" ? config.cols : undefined}
          caption={caption}
        />
      );
    case "zone":
      return (
        <DiagramZone
          smartPct={typeof config.smartPct === "number" ? config.smartPct : undefined}
          smartLabel={typeof config.smartLabel === "string" ? config.smartLabel : undefined}
          dumbLabel={typeof config.dumbLabel === "string" ? config.dumbLabel : undefined}
          scale={Array.isArray(config.scale) ? (config.scale as string[]) : undefined}
          caption={caption}
        />
      );
    case "push-pull":
      return (
        <DiagramPushPull
          rows={Array.isArray(config.rows) ? config.rows : []}
          caption={caption}
        />
      );
    default:
      return <DiagramError message={`Unknown diagram type: ${String(config.type)}`} />;
  }
}
