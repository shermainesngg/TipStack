---
name: tipstack-ui
description: Design system and UI reference for the TipStack website — an AI workflow tip aggregation platform built with Next.js, Tailwind CSS, and shadcn/ui. Use this skill BEFORE writing any TipStack frontend code. Trigger whenever building, styling, or modifying TipStack components, pages, layouts, cards, filters, or any visual element. Also trigger when the user mentions TipStack UI, TipStack design, TipStack styling, TipStack colors, TipStack layout, or asks how a TipStack component should look. This skill provides the authoritative color palette, typography, spacing, component patterns, and interaction behaviors — do not improvise these values.
---

# TipStack UI Design System

This is the single source of truth for TipStack's visual design. Every frontend component, page layout, and style decision must follow this system. The goal: a warm, curated, editorial aesthetic with maximum readability for a content-heavy AI tips site.

TipStack uses **Next.js App Router**, **Tailwind CSS**, and **shadcn/ui**. The visual style is inspired by well-designed editorial sites and zines — warm sage backgrounds, tinted surfaces, strong typographic hierarchy, and deliberate use of whitespace.

## Anti-patterns (from impeccable)

These patterns are BANNED in TipStack. If you find yourself writing any of them, stop and redesign:

1. **Side-stripe borders on cards** — No `border-left` or `border-right` > 1px as colored accent stripes. Use tinted backgrounds or other structural approaches instead.
2. **Reflex fonts** — Never use Inter, Plus Jakarta Sans, DM Sans, Outfit, Space Grotesk, or any font on impeccable's `reflex_fonts_to_reject` list.
3. **Icon tiles above headings** — No rounded icon containers stacked above text. Place icons inline or omit them.
4. **Identical card grids** — Vary card sizes or layouts. Don't repeat the same card shape endlessly.
5. **Pure white or pure black** — Always tint. `#fafcfa` not `#ffffff`. `#1A1A2E` not `#000000`.
6. **Gray text on colored backgrounds** — Use a tint of the background color instead.
7. **Cards wrapped in cards** — Flatten the hierarchy. Not everything needs a container.
8. **Gradient text** — Solid colors only for text.

## Fonts

Load from Google Fonts. Three families, each with a clear role:

| Role | Font | Why |
|------|------|-----|
| Headings | **Bricolage Grotesque** (500–800) | Distinctive geometric with optical sizing, warm and characterful |
| Body & UI | **Source Serif 4** (400–600) | Warm, excellent reading font at 16px, gives credibility to content |
| Code | **JetBrains Mono** | Ligatures, clear at small sizes for technical content |

```tsx
// layout.tsx — Google Fonts import
import { Bricolage_Grotesque, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
```

The pairing of a geometric sans heading with a readable serif body creates visual contrast and editorial warmth.

## Type Scale

Body text at 16.5px with 1.75 line-height is the anchor. Headings use `clamp()` for fluid sizing.

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| h1 | `clamp(2rem, 4vw + 1rem, 3.25rem)` | 800 | 1.05 | Page titles (max-width: 14ch for short lines) |
| h2 | `clamp(1.5rem, 2vw + 0.5rem, 2rem)` | 700 | 1.1 | Featured card titles |
| h3 | 1.15rem | 600 | — | Subsections |
| body | 16.5px | 400 | 1.75 | Prose content (max-width: 65ch) |
| card-title | text-lg (18px) | 600 | snug | Feed card titles |
| meta | 12–14px | 400–500 | — | Timestamps, secondary info |
| label | 11px | 600 | — | Uppercase tracking labels (tracking-[0.12em]) |

**Rules:**
- All headings use `font-heading` (Bricolage Grotesque)
- Body text max-width: 65ch — never wider
- Use `clamp()` for all heading sizes on marketing/content pages
- Apply `antialiased` font smoothing globally

## Color Palette

The palette is **warm and organic** — sage greens, muted earth tones, subtle tinted surfaces. No cold blues, no saturated pastels, no "AI color palette" (cyan-on-dark, purple gradients, neon accents).

### Light Mode (Default)

| Token | Hex | Use |
|-------|-----|-----|
| bg-primary | `#EDF2EC` | Page background — sage mint |
| bg-surface | `#fafcfa` | Featured cards, elevated surfaces — tinted white, NEVER pure #fff |
| bg-muted | `#dde4db` | Subtle backgrounds, hover states, active filter states |
| text-primary | `#1A1A2E` | Headings — dark navy-tinted black |
| text-body | `#3D3D50` | Prose content |
| text-secondary | `#5A5A6E` | Summaries, descriptions |
| text-muted | `#9B9B8E` | Timestamps, metadata labels |
| text-label | `#6E6E7E` | Creator names, secondary metadata |
| text-warm | `#8B6E4E` | "Latest" label, warm accent text |

### Dark Mode

| Token | Hex | Use |
|-------|-----|-----|
| bg-primary | `#161B16` | Page background — warm dark green-black |
| bg-surface | `#1E241E` | Cards, panels |
| bg-muted | `#2A322A` | Subtle backgrounds |
| border | `#3A433A` | Borders (used in dark mode) |
| text-primary | `#EDF2EC` | Headings, body |
| text-body | `#C8D0C6` | Prose content |
| text-secondary | `#A8B0A6` | Descriptions |

### Tag Category Colors

Muted, sophisticated tints — not bright candy pastels:

| Category | Light bg | Light text | Dark bg | Dark text |
|----------|---------|------------|---------|-----------|
| **Tool** | `#f0dbd8` | `#8B4A4A` | `#3D2424` | `#E5A097` |
| **Focus** | `#e0d8ef` | `#5E3F96` | `#2A1F3D` | `#B89DD4` |
| **Workflow** | `#d2e8d6` | `#2D6040` | `#1A3327` | `#7EBE8E` |
| **Domain** | `#f0e8d4` | `#7B6230` | `#2E2818` | `#D4B875` |

Tag pill styling: `text-[11px] font-medium px-2 py-0.5 rounded-md tracking-wide`. No border. Rounded-md, not rounded-full.

### Card Tinted Backgrounds

Regular cards use a full-surface tint based on workflow type instead of a white card + side-stripe:

| Workflow | Light bg | Dark bg |
|----------|---------|---------|
| coding | `#f0f8f2` | `#1a2b1e` |
| automation | `#f3eff8` | `#221e2e` |
| writing | `#faf0ef` | `#2e1e1c` |
| research | `#f9f5ec` | `#2a261a` |
| testing | `#eef5fa` | `#1a2530` |

### Interactive Colors

| Token | Use |
|-------|-----|
| `#1A1A2E` (light) / `#EDF2EC` (dark) | Active filter chips, focus rings |
| `#dde4db` | Active sidebar filter bg, hover states |
| `#6B47A8` / `#C5B3E6` (dark) | Text links — warm purple |

### No Borders in Light Mode

Light mode uses shadows and tinted backgrounds — no visible borders on cards or panels.
Dark mode may add subtle borders (`border-[#3A433A]`) for definition.

## Spacing

8px base grid. Key rhythm:
- Card internal padding: `p-5` (regular), `p-8 lg:p-10` (featured)
- Section gaps: `space-y-6` between cards
- Desktop sidebar gap: `gap-10`
- Stats line: `gap-x-6`
- Tag gaps: `gap-1.5` (pills), `gap-2` (filter chips)

**Key rule:** Use spacing, not dividers. Separate sections with whitespace, not `<hr>` elements.

## Border Radius

| Element | Tailwind |
|---------|----------|
| Cards | `rounded-2xl` |
| Tag pills | `rounded-md` |
| Filter chips | `rounded-full` |
| Code blocks | `rounded-xl` |
| Inline code | `rounded-md` |

## Page Layouts

### Feed Page (Home)

- Left-aligned hero with fluid heading (`clamp`)
- Inline stat line (not stat cards): `4 tips  9 tools  11 workflows`
- Desktop: bare sidebar navigation (no card wrapper) + content column
- Featured card: full-width, `#fafcf9` surface, layered shadow
- Regular cards: tinted backgrounds per workflow, 2-column grid
- Empty state: left-aligned text with personality, no generic icons

### Detail Page

- Max-width: 680px, generous vertical padding
- Back link: small, muted, `text-[#9B9B8E]`
- Tags above the title
- Fluid title: `clamp(1.75rem, 3vw + 0.5rem, 2.5rem)`, max-width: 20ch
- Source attribution: divider line, no card wrapper

## Component Patterns

### Header

Minimal text logo. No icon tiles, no borders, no gradients.

```tsx
<header className="sticky top-0 z-40 bg-[#EDF2EC]/90 backdrop-blur-sm">
  <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5">
    <Link href="/" className="text-lg font-heading font-bold tracking-tight">
      TipStack
    </Link>
  </div>
</header>
```

### Sidebar Filter (Desktop)

Bare navigation with section labels. No card wrapper. Uses active state bg for selection.

### Feed Cards

Regular cards: tinted background, tags on top, title, summary, meta line at bottom.
Featured card: slightly elevated surface (`#fafcf9`), layered shadow, fluid title.
Neither card type uses side-stripe borders or icon tiles.

### Blockquotes

Full tinted background (`#e8efe7`), rounded-xl. No border-left accent stripe.

### Source Attribution

Separated by a top border line. No card wrapper. Clean text + link.

## Interaction Patterns

| Pattern | Implementation |
|---------|---------------|
| Card hover (regular) | `hover:-translate-y-0.5` + shadow appear. Duration: 300ms ease-out |
| Card hover (featured) | Shadow intensifies. No translate. |
| Filter active (sidebar) | `bg-[#dde4db] font-semibold text-[#1A1A2E]` |
| Filter active (chips) | `bg-[#1A1A2E] text-[#fafcfa]` |
| Links | Purple (`#6B47A8`) with underline, offset-2, decoration fades in |
| Focus states | `focus-visible:ring-2 ring-[#1A1A2E] ring-offset-2` |

## Design Principles (Tiebreakers)

1. **Editorial over dashboard** — this is a reading experience, not a SaaS app
2. **Typography carries the design** — Bricolage + Source Serif do the heavy lifting
3. **Warm over cold** — sage, earth, muted tones. Never cold gray or saturated blue
4. **Readability first** — if it hurts readability, don't do it
5. **Tinted surfaces over bordered boxes** — cards use background tints, not borders
6. **Whitespace over decoration** — separate with space, not borders or dividers
7. **Variety over repetition** — break up identical patterns
8. **Content over chrome** — the tip content is the star, UI stays out of the way
