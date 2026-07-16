# Article diagrams

Reusable, styled diagram components for TipStack article bodies. This is the
**standard way to add diagrams to any article going forward** — not mermaid.

## Aesthetic

These diagrams deliberately use a **"blueprint" palette** (indigo / ember / teal
on warm paper) that departs from the sage `tipstack-ui` site chrome. That's
intentional: diagrams read as a distinct, technical layer. Palette + fonts live
in `tokens.ts`. Fonts: `font-mono` (JetBrains) for the instrument vocabulary
(skill names, step numbers, labels), `font-heading` (Bricolage) for node titles.

## How to use in an article

Add a fenced code block with the language `diagram`. The body is JSON with a
`type` discriminator. `MarkdownBody` parses and renders it (see `../markdown-body.tsx`).

Parsing is total — malformed or unknown config renders a quiet fallback instead
of throwing, and every value is placed as escaped text/SVG (never
`dangerouslySetInnerHTML`), so it's safe even for pipeline-authored content.

Every type accepts an optional `"caption"` string.

### `loop` — a cyclic process (Plan → Implement → Validate …)

```diagram
{"type":"loop","center":["clear context","↺ repeat"],"nodes":[
  {"n":"01","tag":"PLAN","label":"align & spec","tone":"plan"},
  {"n":"02","tag":"BUILD","label":"agent, AFK","tone":"impl"},
  {"n":"03","tag":"CHECK","label":"QA & review","tone":"valid"}
]}
```

Nodes are spaced evenly around a circle (2+ supported). Arrows are clockwise and
colored by the source node's `tone`.

### `pipeline` — an ordered sequence with arrows

`variant:"card"` (labeled step cards) or `variant:"chip"` (compact colored chips).
`loop:true` adds a trailing ↺ back to the start.

```diagram
{"type":"pipeline","variant":"card","steps":[
  {"phase":"Plan","tone":"plan","cmd":"/grill-me","role":"Align"},
  {"phase":"Build","tone":"impl","cmd":"/implement","role":"AFK loop"}
]}
```

```diagram
{"type":"pipeline","variant":"chip","loop":true,"steps":[
  {"label":"RED · failing test","tone":"red"},
  {"label":"GREEN · make it pass","tone":"valid"},
  {"label":"REFACTOR · clean up","tone":"plan"}
]}
```

### `slices` — horizontal layers vs. vertical slices

```diagram
{"type":"slices","layers":["DB","API","UI"],"cols":3}
```

### `zone` — a two-band quality bar (e.g. smart zone vs. dumb zone)

```diagram
{"type":"zone","smartPct":50,"smartLabel":"SMART ZONE","dumbLabel":"DUMB ZONE","scale":["0","~100k tokens","200k+"]}
```

### `push-pull` — contrasted delivery mechanisms

```diagram
{"type":"push-pull","rows":[
  {"badge":"Push","tone":"impl","token":"CLAUDE.md","desc":"Always in context…"},
  {"badge":"Pull","tone":"plan","token":"skills","desc":"Loaded on demand…"}
]}
```

## Tones

`plan` (indigo) · `impl` (ember) · `valid` (teal) · `red` · `neutral`.
Unknown values fall back to `neutral`.

## Adding a new diagram type

1. Add a component file here (a server component — no client hooks needed).
2. Wrap its output in `<DiagramFrame caption={caption} scroll?>`.
3. Style only through `tokens.ts` so light/dark stay consistent.
4. Register a `case` in `index.tsx`.
5. Document the config shape above.

## Deploying content that uses diagrams

The rendered output depends on this component code. When you publish an article
body containing `diagram` fences, make sure this code is **deployed** — otherwise
the fences render as raw JSON code blocks on the live site.
