---
name: tipstack-ui
description: Design system and UI reference for the TipStack website — an AI workflow tip aggregation platform built with Next.js, Tailwind CSS, and shadcn/ui. Use this skill BEFORE writing any TipStack frontend code. Trigger whenever building, styling, or modifying TipStack components, pages, layouts, cards, filters, or any visual element. Also trigger when the user mentions TipStack UI, TipStack design, TipStack styling, TipStack colors, TipStack layout, or asks how a TipStack component should look. This skill provides the authoritative color palette, typography, spacing, component patterns, and interaction behaviors — do not improvise these values.
---

# TipStack UI Design System

This is the single source of truth for TipStack's visual design. Every frontend component, page layout, and style decision must follow this system. The goal: a warm, inviting, dashboard-like aesthetic with maximum readability for a content-heavy AI tips site.

TipStack uses **Next.js App Router**, **Tailwind CSS**, and **shadcn/ui**. The visual style is inspired by modern education/SaaS dashboards — soft sage backgrounds, warm pastel accents, generous rounding, and shadow-based depth (no harsh borders).

## Fonts

Load from Google Fonts. Three families, each with a clear role:

| Role | Font | Why |
|------|------|-----|
| Headings | **Plus Jakarta Sans** (fallback: Inter) | Geometric, modern, friendly feel at large sizes |
| Body & UI | **Inter** | Industry standard for screen readability at all sizes |
| Code | **JetBrains Mono** (fallback: Fira Code) | Ligatures, clear at small sizes for technical content |

```tsx
// layout.tsx — Google Fonts import
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'
```

## Type Scale

Body text at 16px with 1.7 line-height is non-negotiable for reading comfort. Everything else derives from that anchor.

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| h1 | 36–42px | 700–800 | 1.1–1.2 | -0.02em | Page titles |
| h2 | 24–28px | 600–700 | 1.3 | -0.01em | Section headings |
| h3 | 20–22px | 600 | 1.4 | — | Subsections |
| body | 16–17px | 400 | 1.6–1.75 | — | Prose content |
| card-title | 18–20px | 600 | 1.3 | — | Feed card titles |
| meta | 13–14px | 400–500 | 1.5 | — | Timestamps, secondary info |
| tag | 13px | 500 | 1 | — | Tag pills |

**Spacing around headings in article body:**
- H2: 48–64px top margin, 16–24px bottom margin (creates clear section breaks)
- H3: 32px top margin, 12px bottom margin
- Paragraphs: 24px between them (block spacing, no first-line indent)

**Rules:**
- Max 3 font weights per page: 400 (body), 500 or 600 (emphasis/UI), 700 (headings)
- Body text max-width: 700px — never wider. This keeps lines at 65–75 characters, the optimal range for sustained reading.
- Apply `antialiased` font smoothing globally.

## Color Palette

The palette is **warm and organic** — sage greens, soft pinks, lavenders, and mints. No cold blues or saturated indigos. The aesthetic is friendly and approachable, like a modern education dashboard.

### Light Mode (Default)

| Token | Hex | Use |
|-------|-----|-----|
| bg-primary | `#EDF2EC` | Page background. Sage mint — warm, organic, never cold gray or pure white. |
| bg-surface | `#FFFFFF` | Cards, panels, modals |
| bg-muted | `#E2E8E0` | Subtle backgrounds, disabled states, skeleton loaders |
| text-primary | `#1A1A2E` | Headings, body text — dark navy, not pure black |
| text-body | `#3D3D50` | Prose content in article body — slightly softer than headings |
| text-secondary | `#7C8590` | Descriptions, metadata, secondary info |
| text-muted | `#A0A8B0` | Timestamps, tertiary info, section labels |

### Dark Mode

| Token | Hex | Use |
|-------|-----|-----|
| bg-primary | `#161B16` | Page background — warm dark green-black |
| bg-surface | `#1E241E` | Cards, panels |
| bg-muted | `#2A322A` | Subtle backgrounds |
| border | `#3A433A` | Borders (used in dark mode only) |
| text-primary | `#EDF2EC` | Headings, body |
| text-body | `#C8D0C6` | Prose content |
| text-secondary | `#8C9688` | Descriptions |

Dark mode uses **shadow-based depth** with warm dark greens, not cold slates. Cards use `shadow-[0_2px_12px_rgba(0,0,0,0.2)]` for depth.

### Brand / Interactive Colors

The primary interactive color is **dark charcoal** — not indigo. This matches the warm, organic aesthetic.

| Token | Hex | Use |
|-------|-----|-----|
| interactive-primary | `#2D2D3F` | Active filter states, logo bg, focus rings — THE action color |
| interactive-primary (dark) | `#EDF2EC` | Inverted in dark mode — light text/bg for active states |
| link | `#6B47A8` | Text links — warm purple |
| link-hover | `#5B3D99` | Link hover state |
| link (dark) | `#C5B3E6` | Dark mode links |

All interactive elements (buttons, active filters, focus rings) use `interactive-primary`. Links use the warm purple.

### Pastel Accent Palette

These pastels are used for stat cards, tag pills, card accents, and decorative elements. Each has a bg shade and a deeper text/icon shade.

| Name | Background | Deeper shade (icons/text) | Use |
|------|-----------|--------------------------|-----|
| **Pink** | `#FADCD9` | `#994D4D` | Tool tags, "Tips" stat card, featured badge |
| **Lavender** | `#E5DCFA` | `#6B47A8` | Role tags, "Tools" stat card, links |
| **Mint** | `#D5EFDA` | `#2D6B45` | Workflow tags, "Workflows" stat card, blockquotes |
| **Peach** | `#FDEBD3` | `#9B6B3D` | Secondary accents |
| **Gold** | `#FFF3D6` | `#8B7030` | Research-related accents |

Icon container backgrounds use a slightly deeper shade: pink icon bg `#F5C4BE`, lavender icon bg `#D4C8F0`, mint icon bg `#C0E6C8`.

### Tag Category Colors

Each of TipStack's three tag categories gets a distinct pastel family:

| Category | Light bg | Light text | Dark bg | Dark text | Examples |
|----------|---------|------------|---------|-----------|----------|
| **Tool** | `#FADCD9` | `#994D4D` | `#3D2424` | `#F5B0AA` | Claude Code, Cursor, GPT, Copilot |
| **Role** | `#E5DCFA` | `#6B47A8` | `#2A1F3D` | `#C5B3E6` | Developer, PM, Designer, Founder |
| **Workflow** | `#D5EFDA` | `#2D6B45` | `#1A3327` | `#8ECDA0` | Coding, Automation, Writing, Research |

Tag pill styling: `text-xs font-medium px-2.5 py-1 rounded-full`. No border needed — background color provides the visual.

### Card Left-Border Accent Colors (Pastel)

Each workflow type maps to a soft pastel accent for the card's left border:

| Workflow | Color | Hex |
|----------|-------|-----|
| coding / code-generation | Soft green | `#8ECDA0` |
| automation / pipeline | Soft lavender | `#C5B3E6` |
| writing | Soft pink | `#F5B0AA` |
| research | Soft gold | `#F5D98C` |
| debugging | Soft pink | `#F5B0AA` |
| design | Soft rose | `#F5C4D0` |
| testing / code-review | Soft blue | `#A8D4E6` |
| developer-experience | Soft periwinkle | `#A8C8F0` |
| team-workflow / stakeholder | Soft peach | `#F5D0A0` |

### No Borders in Light Mode

Light mode cards use **shadows only** for depth — no visible borders. This creates the soft, floating card look.
- Card resting: `shadow-[0_2px_12px_rgba(0,0,0,0.06)]`
- Card hover: `shadow-[0_6px_20px_rgba(0,0,0,0.1)]`
- Featured card hover: `shadow-[0_8px_24px_rgba(0,0,0,0.1)]`

Dark mode can add subtle borders (`border-[#3A433A]`) since shadows are less visible.

## Spacing

8px base grid. Use Tailwind spacing utilities:

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| space-1 | 4px | p-1 | Inline padding, icon gaps |
| space-2 | 8px | p-2 | Tag padding, tight spacing |
| space-3 | 12px | p-3 | Small card internal padding |
| space-4 | 16px | p-4 | Standard padding, gaps |
| space-5 | 20px | p-5 | Card padding |
| space-6 | 24px | p-6 | Small section padding, card gap |
| space-8 | 32px | p-8 | Section gaps |
| space-10 | 40px | p-10 | Major section padding |
| space-12 | 48px | p-12 | Page section spacing |
| space-16 | 64px | p-16 | Hero/footer spacing |

**Key rule:** Use spacing, not dividers. Separate sections with 32–48px gaps instead of `<hr>` elements. The design should breathe.

## Border Radius

Everything is generously rounded — this is central to the warm, friendly aesthetic.

| Element | Radius | Tailwind |
|---------|--------|----------|
| Cards | 16px | `rounded-2xl` |
| Stat pills | 16px | `rounded-2xl` |
| Sidebar filter panel | 16px | `rounded-2xl` |
| Tag pills | full | `rounded-full` |
| Filter chips | full | `rounded-full` |
| Icon containers | 12px | `rounded-xl` |
| Logo icon | 12px | `rounded-xl` |
| Code blocks | 12px | `rounded-xl` |
| Inline code | 8px | `rounded-lg` |
| Buttons | 12px | `rounded-xl` |

Never use sharp corners (`rounded-none`) or small radius (`rounded`, `rounded-md`). Minimum is `rounded-lg`.

## Page Layouts

### Feed Page (Home)

```
┌─────────────────────────────────────────────────┐
│  Header (sticky, blends with sage bg)           │
│  [Logo icon] TipStack                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  AI Workflow Tips              ← h1, bold       │
│  Subtitle text                 ← text-secondary │
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐         │
│  │ 4 Tips  │ │ 3 Tools │ │ 5 Flows  │← pastel │
│  │  (pink) │ │ (lav.)  │ │ (mint)   │  stats  │
│  └─────────┘ └─────────┘ └──────────┘         │
│                                                 │
│  ┌──────────┐  ┌──────────────────────────────┐│
│  │ Filters  │  │  Featured Card (latest tip)  ││
│  │ (sidebar)│  │  [Sparkles] Latest            ││
│  │ ──────── │  │  Title (xl-2xl, bold)         ││
│  │ TOOLS    │  │  Summary (3-line clamp)       ││
│  │ · Claude │  │  @creator · date · tags       ││
│  │ · Cursor │  └──────────────────────────────┘│
│  │ ──────── │  ┌────────┐  ┌────────┐          │
│  │ ROLES    │  │ Card 2 │  │ Card 3 │ 2-col   │
│  │ · Dev    │  └────────┘  └────────┘ grid     │
│  │ · PM     │  ┌────────┐                      │
│  │ ──────── │  │ Card 4 │                      │
│  │ WORKFLOW │  └────────┘                      │
│  │ · Coding │                                  │
│  └──────────┘                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Max width: 1200px, centered
- Desktop: sidebar filter (220px) + content column with 32px gap
- Mobile: horizontal filter chips (sticky), single column cards
- Featured card spans full content width
- Remaining cards: `grid grid-cols-1 md:grid-cols-2 gap-5`
- Mobile padding: 20px horizontal

### Detail Page (Content)

```
┌─────────────────────────────────────────────┐
│  Header                                     │
├─────────────────────────────────────────────┤
│                                             │
│  ← Back to feed         (text-secondary)    │
│                                             │
│  [Tool] [Role] [Workflow]  ← pastel pills   │
│                                             │
│  Article Title (H1, extrabold)              │
│  Source: @creator on YouTube · Apr 10       │
│                                             │
│  Body content (max-w: 700px)                │
│  ...                                        │
│                                             │
│  ┌─ Source Attribution Card ──────────┐     │
│  │  by @creator on YouTube            │     │
│  │  View Original →  (warm purple)    │     │
│  └────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

- Content column: max-width 700px, centered
- Back link: `text-[#7C8590] hover:text-[#1A1A2E]`
- Tags above the title
- Source attribution cards: white bg, rounded-2xl, shadow (no border)

## Component Patterns

### Header

Minimal, blends with the sage page background. No border, no gradient line.

```tsx
<header className="sticky top-0 z-40 bg-[#EDF2EC]/90 backdrop-blur-sm dark:bg-[#161B16]/90">
  <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D2D3F] dark:bg-[#EDF2EC]">
        <Layers className="h-4 w-4 text-white dark:text-[#161B16]" />
      </div>
      <span className="text-lg font-bold tracking-tight font-heading">TipStack</span>
    </Link>
  </div>
</header>
```

### Stat Pills

Three pastel-colored stat cards in the heading area, each with an icon in a deeper-shade container:

```tsx
<div className="flex items-center gap-3 rounded-2xl bg-[#FADCD9] px-4 py-3">
  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5C4BE]">
    <Lightbulb className="h-4 w-4 text-[#994D4D]" />
  </div>
  <div>
    <p className="text-xl font-bold text-[#1A1A2E] leading-none">{count}</p>
    <p className="text-xs text-[#994D4D] mt-0.5">Tips</p>
  </div>
</div>
```

Repeat with lavender (`#E5DCFA` / `#D4C8F0` / `#6B47A8`) for Tools and mint (`#D5EFDA` / `#C0E6C8` / `#2D6B45`) for Workflows.

### Feed Card (Regular)

White card, pastel left accent border, shadow-based depth, generous rounding:

```tsx
<article className="relative rounded-2xl bg-white p-5
  shadow-[0_2px_12px_rgba(0,0,0,0.06)]
  group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)]
  group-hover:-translate-y-0.5 transition-all duration-200
  dark:bg-[#1E241E] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
  {/* Pastel left accent border */}
  <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-[#8ECDA0]" />
  <div className="pl-3">
    <p className="text-[13px] font-medium text-[#A0A8B0]">CATEGORY</p>
    <h2 className="mt-1.5 text-[18px] font-semibold leading-snug text-[#1A1A2E] line-clamp-2 font-heading">Title</h2>
    <p className="mt-2 text-[15px] leading-relaxed text-[#7C8590] line-clamp-2">Summary</p>
    <div className="mt-3 flex items-center justify-between">
      <p className="text-[13px] text-[#A0A8B0]">@creator · date</p>
      <div className="flex gap-1.5">{/* TagPills, max 3 */}</div>
    </div>
  </div>
</article>
```

### Feed Card (Featured)

Full-width card for the latest tip, with a pastel pink icon and "Latest" badge:

```tsx
<article className="rounded-2xl bg-white p-6 lg:p-8
  shadow-[0_2px_12px_rgba(0,0,0,0.06)]
  group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]
  transition-all duration-200
  dark:bg-[#1E241E]">
  <div className="flex items-start gap-4">
    <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FADCD9]">
      <Sparkles className="h-6 w-6 text-[#994D4D]" />
    </div>
    <div className="min-w-0 flex-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#994D4D]">Latest</span>
      <h2 className="mt-1.5 text-xl lg:text-2xl font-bold leading-snug text-[#1A1A2E] font-heading line-clamp-2">Title</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#7C8590] line-clamp-3">Summary</p>
      {/* Meta row: @creator · date + TagPills (max 5) */}
    </div>
  </div>
</article>
```

### Sidebar Filter Panel (Desktop)

White card with grouped filter sections. Visible only on `lg:` breakpoint.

```tsx
<div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]
  dark:bg-[#1E241E] dark:shadow-none">
  <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A2E] mb-4">
    <Filter className="h-4 w-4 text-[#A0A8B0]" />
    Filters
  </div>
  <button className="w-full text-left rounded-xl px-3 py-2 text-sm font-medium
    bg-[#2D2D3F] text-white  /* active state */
    text-[#64748B] hover:bg-[#E2E8E0]  /* inactive state */
  ">All Tips</button>
  {/* Section: TOOLS (Wrench icon), ROLES (Users icon), WORKFLOWS (Zap icon) */}
  {/* Section headers: text-xs font-semibold uppercase tracking-wider text-[#A0A8B0] */}
</div>
```

Active state: `bg-[#2D2D3F] text-white` (dark mode: `bg-[#EDF2EC] text-[#161B16]`).
Inactive state: `text-[#64748B] hover:bg-[#E2E8E0]`.

### Filter Chips (Mobile)

Horizontal scrollable bar, sticky below header. Same active/inactive logic.

```tsx
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide
  [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]">
  <button className="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap
    bg-[#2D2D3F] text-white  /* active */
    bg-white text-[#64748B] hover:bg-[#F5F5F0]  /* inactive */
  ">All</button>
</div>
```

### Code Blocks

Dark background regardless of site theme:

```css
.code-block {
  background: #1A1A2E;       /* matches text-primary, warm dark */
  border-radius: 12px;       /* rounded-xl */
  padding: 20px 24px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #E8EDE6;
  overflow-x: auto;
}
```

Inline code: `bg-[#E2E8E0] text-[#1A1A2E] px-1.5 py-0.5 rounded-lg text-[15px] font-mono` (dark: `bg-[#2A322A] text-[#EDF2EC]`).

### Callout / Blockquote

Mint-colored with rounded-xl corners:

```tsx
<blockquote className="my-6 rounded-xl border-l-4 border-[#8ECDA0] bg-[#EDF5EF] p-4
  dark:bg-[#1A3327]/50 dark:border-[#8ECDA0]">
  <p className="text-sm font-medium text-[#2D6B45] dark:text-[#8ECDA0]">
    Tip content here
  </p>
</blockquote>
```

### Source Attribution Card

White card, rounded-2xl, shadow. Links in warm purple.

```tsx
<div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]
  dark:bg-[#1E241E] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
  <p className="text-sm text-[#7C8590]">by @creator on YouTube</p>
  <a className="mt-3 inline-flex items-center gap-1 text-sm font-medium
    text-[#6B47A8] hover:text-[#5B3D99]
    dark:text-[#C5B3E6] dark:hover:text-[#D4C8F0]">
    View Original →
  </a>
</div>
```

### Skeleton Loading States

Use sage-tinted placeholders on white card:

```tsx
<div className="animate-pulse rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
  <div className="h-3 w-24 rounded-lg bg-[#E2E8E0] mb-3" />
  <div className="h-5 w-3/4 rounded-lg bg-[#E2E8E0] mb-2" />
  <div className="h-5 w-1/2 rounded-lg bg-[#E2E8E0] mb-4" />
  <div className="h-4 w-full rounded-lg bg-[#E2E8E0] mb-2" />
  <div className="h-4 w-5/6 rounded-lg bg-[#E2E8E0]" />
</div>
```

## Interaction Patterns

| Pattern | Implementation |
|---------|---------------|
| Feed loading | "Load more" button (not pagination). Infinite scroll is acceptable alternative. |
| Card hover | `hover:-translate-y-0.5` + increased shadow (`0_6px_20px`). Transition duration: 200ms |
| Featured card hover | Shadow increases to `0_8px_24px`. No translate. |
| Dark mode toggle | `prefers-color-scheme` auto-detect + manual toggle. Preference in localStorage |
| Focus states | `focus-visible:ring-2 ring-[#2D2D3F] ring-offset-2` on all interactive elements |
| Filter active | Dark charcoal bg + white text. Transition: 150ms colors. |

## Accessibility

- Minimum **4.5:1 contrast ratio** (WCAG AA) on all text
- All interactive elements must have visible focus states
- Tag colors are supplemented by text labels (don't rely on color alone)
- Images (if any) require alt text
- Filter state changes announced via `aria-live` region
- Semantic HTML: `<article>` for cards, `<nav>` for filters, `<main>` for content

## Design Principles (Tiebreakers)

When in doubt about a design decision, use these ranked principles:

1. **Warm over cold** — sage, pink, lavender, mint. Never cold gray or saturated blue.
2. **Readability first** — if it hurts readability, don't do it
3. **Shadows over borders** — cards float with soft shadows in light mode, no visible borders
4. **Generous rounding** — minimum rounded-lg, prefer rounded-xl and rounded-2xl
5. **Whitespace over decoration** — separate with space, not borders or dividers
6. **Color means something** — every color encodes tag category, status, or interactivity
7. **Consistent over clever** — follow the system, don't invent one-off styles
8. **Content over chrome** — the tip content is the star, UI stays out of the way
