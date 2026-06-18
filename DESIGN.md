---
name: CivicSec Lab
description: Open-source civic security intelligence platform for civic organisations and NGOs.
colors:
  # ── Orbital / Instrument register — marketing pages (/, /about) ──────────────
  orbital-navy:       "#070f17"
  orbital-cream:      "#f4ecdb"
  orbital-muted:      "#a9bac4"
  orbital-faint:      "#7d92a0"
  orbital-orange:     "#e0662f"
  orbital-orange-lt:  "#f5965c"
  orbital-gold:       "#e7b052"
  # ── App sidebar / nav rail — navy dark ───────────────────────────────────────
  app-navy:           "#0f2230"
  app-navy-panel:     "#173241"
  app-navy-border:    "#24414f"
  app-navy-hover:     "#1d3a49"
  app-navy-text:      "#f3eadc"
  app-navy-muted:     "#9fb0b8"
  # ── App working area — cream light ───────────────────────────────────────────
  paper:              "#f4ecdb"
  paper-card:         "#fcf9f2"
  paper-line:         "#e7dcc7"
  paper-raise:        "#efe6d4"
  # ── Ink — text on cream ──────────────────────────────────────────────────────
  ink:                "#15242f"
  ink-soft:           "#505962"
  ink-faint:          "#6f6657"
  # ── Semantic / brand (shared across registers) ───────────────────────────────
  orange:             "#d65a29"
  amber:              "#d99a3c"
  rose:               "#ee6c7a"
  sage:               "#4f8a5b"
  blue:               "#71a7ff"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, ui-serif, serif"
    fontSize: "clamp(2.6rem, 5.6vw, 4.7rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Source Serif 4, Georgia, ui-serif, serif"
    fontSize: "clamp(1.9rem, 4vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Source Serif 4, Georgia, ui-serif, serif"
    fontSize: "clamp(1.15rem, 2vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.18em"
    lineHeight: 1.0
rounded:
  pill: "999px"
  xl:   "16px"
  lg:   "12px"
  md:   "10px"
  sm:   "8px"
  xs:   "4px"
spacing:
  xs:      "4px"
  sm:      "8px"
  md:      "16px"
  lg:      "24px"
  xl:      "32px"
  section: "clamp(4rem, 9vmin, 8rem)"
components:
  button-orbital-primary:
    backgroundColor: "{colors.orbital-orange}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "13px 24px"
  button-orbital-primary-hover:
    backgroundColor: "{colors.orbital-orange-lt}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "13px 24px"
  button-orbital-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.orbital-muted}"
    rounded: "{rounded.md}"
    padding: "13px 24px"
  button-app-primary:
    backgroundColor: "{colors.orange}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-app-primary-hover:
    backgroundColor: "#e2703f"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-app-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  chip-system:
    backgroundColor: "rgba(10,18,26,0.5)"
    textColor: "{colors.orbital-muted}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  chip-system-active:
    backgroundColor: "rgba(224,102,47,0.14)"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  card-app:
    backgroundColor: "{colors.paper-card}"
    rounded: "{rounded.sm}"
    padding: "20px"
  badge-orange:
    backgroundColor: "#d65a291a"
    textColor: "{colors.orange}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  badge-amber:
    backgroundColor: "#d99a3c1a"
    textColor: "{colors.amber}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  badge-rose:
    backgroundColor: "#ee6c7a1a"
    textColor: "{colors.rose}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  badge-sage:
    backgroundColor: "#4f8a5b1a"
    textColor: "{colors.sage}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: CivicSec Lab

## 1. Overview

**Creative North Star: "The Civic Signal Core"**

CivicSec Lab is an instrument that watches. The product metaphor is flight telemetry
meeting investigative journalism — a system that orbits six kinds of civic threat, reads
their signals, and surfaces evidence for human review. The visual language follows that
metaphor precisely: one continuous instrument world, framed in the vocabulary of a
mission control HUD, built around a live orbital Three.js field on the marketing pages
and a cream-on-navy analytical shell in the platform itself.

Two tonal registers, one typographic and hue family. The **instrument register** (marketing
pages `/` and `/about`) is deep-space near-black (`#070f17`) with a warm orange glow
emanating from the orbital centre — an immersive cinematic world the visitor descends
into. The **platform register** (the logged-in app) inverts to warm cream (`#f4ecdb`)
as the working surface, with a structured deep-navy sidebar (`#0f2230`) carrying the
same instrument chrome. The same Source Serif 4 headings, the same Inter body copy, the
same Geist Mono telemetry labels appear in both. A visitor stepping from the marketing
site into the platform should feel continuity in voice and craft — different lighting,
same instrument.

The personality is authoritative and precise. Closer to a well-edited government
intelligence brief than a startup landing page. Copy never draws conclusions on behalf
of the user; the platform surfaces signals and evidence, humans decide. Visual hierarchy
serves comprehension, not spectacle. Every animation earns its presence; decoration
without informational purpose does not exist here.

**Key Characteristics:**
- Two-register instrument: deep-space orbital field (marketing) + cream analytical shell (app)
- One hue family: warm orange (`#e0662f` / `#d65a29`) as the single accent across both
- Typography on a contrast axis: Source Serif 4 (display authority) + Inter (humanist readability) + Geist Mono (instrument chrome only)
- Cream (`#f4ecdb`) is the connective thread: text color on the dark orbital field, page background in the app
- Tonal layering for depth in the app; atmospheric glow for depth in the orbital field
- `prefers-reduced-motion` respected everywhere; all animations have instant-crossfade fallbacks
- WCAG AA minimum throughout; no information conveyed by colour alone

## 2. Colors: The Orbital Signal Palette

Two registers share one hue family. Orange is the single accent — the signal glow on
the orbital field and the brand touch in the analytical platform. Neither register
introduces a second accent colour.

**Note on orange token split:** The instrument register uses `#e0662f` (slightly deeper,
more saturated for legibility against `#070f17` near-black). The app register uses
`#d65a29` (same hue, slightly cooler for the cream surface). These are the same brand
colour expressed at different optical weights for their respective surfaces — not two
separate accents.

### Primary

- **Orbital Glow Orange** (`#e0662f`): The instrument register's single accent. Used
  for all CTA buttons, interactive states, animated orbit-label glow, HUD corner
  brackets, the pulsing scroll cue, and module hover tints on the landing. At full
  opacity it reads as the "hot signal" in the dark field. At `rgba(224,102,47,0.3)` it
  forms the warm amber hairlines (`--line`) between sections on the About page.

- **Orange Light** (`#f5965c`): Kicker labels within the `ofx-beat` scroll narrative
  ("Why it exists", "What it does"). Also hover/active state of the ghost button and
  the focus ring on orbital interactive elements. Never used as a primary surface colour.

- **Brand Signal Orange** (`#d65a29`): The app register's primary accent — buttons,
  active icon states, glow shadow under primary CTAs. Slightly darker optical weight
  than the orbital orange to hold its presence against cream. All semantic orange
  references in the platform use this value; do not substitute the orbital orange.

### Secondary

- **Harvest Gold** (`#e7b052`): Exclusively used in the orbital HUD telemetry —
  `SYSTEMS 6/6 · LINK STABLE` and the live clock in `ofx-met`. It distinguishes live
  status readouts from descriptive faint labels. Never used outside HUD context.

- **Caution Amber** (`#d99a3c`): Warning and caution states in the app — in-progress
  badge, anomaly score thresholds, non-zero counter values that require attention.
  Semantic; never decorative.

### Tertiary

- **Critical Rose** (`#ee6c7a`): Error states, destructive actions, critical-severity
  findings, closed-with-issue status. Semantic; appears only when its condition is met.

- **Evidence Sage** (`#4f8a5b`): The Civic Risk Graph module accent — node colour in
  the architecture SVG, badge background tint in the Risk Graph module. Not a status
  colour; a module identity colour.

- **Reference Blue** (`#71a7ff`): Informational callouts, the LogLens module accent in
  the architecture SVG, external link badges. Fourth semantic role; reaches only when
  the other three don't apply.

### Neutral (instrument register — dark)

- **Deep Space** (`#070f17`): Orbital field background. The deepest surface in the
  instrument register. The Three.js canvas renders over it; the fixed ambient layers
  (vignette, glow) sit above it.

- **Orbital Cream** (`#f4ecdb`): Primary text colour on the dark orbital field. Also
  the background of the working platform — the connecting thread between both registers.
  At `opacity: 0.88–0.92` it forms the body copy on cinematic scroll beats.

- **Signal Muted** (`#a9bac4`): Body text on the About page, muted labels on scroll
  beats, nav links in default state. Blue-grey tone provides contrast without
  warmth clash against the navy field.

- **Telemetry Faint** (`#7d92a0`): HUD readout labels, orbit-label code values,
  section captions, scroll cue text. The dimmest readable level on the orbital field.
  At 10.5px Geist Mono it passes WCAG AA (5.96:1 on `#070f17`).

### Neutral (platform register — light)

- **Warm Cream** (`#f4ecdb`): The app's working surface. The same value as Orbital
  Cream above; the connection is intentional.

- **Card Near-White** (`#fcf9f2`): Cards and elevated panels in the app. Perceptibly
  lighter than the cream base without reading as pure white.

- **Hairline Warm** (`#e7dcc7`): All borders and dividers on cream surfaces. One
  consistent hairline value; do not introduce a second.

- **Hover Warm** (`#efe6d4`): Interactive row backgrounds on hover in the app.

- **Deep Navy Ink** (`#15242f`): Headings and primary numerals in the app. Dark navy,
  not pure black — retains the hue family even at maximum contrast.

- **Body Slate** (`#505962`): Body copy and secondary text in the app. ≥7:1 on cream.

- **Faint Warm Slate** (`#6f6657`): Small labels, timestamps, column headers. ≥4.5:1
  on cream card. Carries a warm lean matching the cream's own OKLCH hue.

### Neutral (sidebar rail — dark navy)

- **Instrument Navy** (`#0f2230`): Sidebar and nav rail background. Dark navy, not
  near-black — carries more hue than the orbital field to distinguish the two systems
  within the same session.

- **Panel Navy** (`#173241`): Raised surfaces within the sidebar (section headers,
  active item backgrounds).

- **Border Navy** (`#24414f`): Hairline borders inside the sidebar.

- **Hover Navy** (`#1d3a49`): Nav item hover state.

- **Navy Text** (`#f3eadc`): Text on the navy rail. Warm cream, slightly more towards
  pure white than the working-area cream.

- **Navy Muted** (`#9fb0b8`): Secondary text on the navy rail — section labels, inactive
  nav items.

**The One-Accent Rule.** In either register, one orange is the accent and nothing else
is. Amber, rose, sage, and blue appear only when their specific semantic condition is
met. Two accent colours on the same surface without distinct semantic meaning is a defect.

**The Register Bridge Rule.** Cream (`#f4ecdb`) is the shared hue between registers.
On the dark orbital field it is the foreground; in the app it is the background. An AI
agent generating new screens should use this value — not any warm-neutral approximation —
so the hue bridge holds.

## 3. Typography: The Instrument Triplet

**Display / Headings Font:** Source Serif 4 (variable, 400–900, Google Fonts)
**Body / UI Font:** Inter (400, 500, 600, 700, system-ui stack)
**HUD / Telemetry Font:** Geist Mono (400, Google Fonts) — instrument chrome only

**Character:** Source Serif 4's editorial authority anchors every heading — its optical
sizing, wide weight range, and humanist serifs place the platform in the tradition of
serious public-interest publishing. Inter's neutrality and screen legibility handle all
copy and data. Geist Mono's mechanical clarity codes the HUD layer as machine readout,
not human prose. The triplet only works when Geist Mono stays confined to its role:
never use it for headings or body copy.

### Hierarchy

- **Display** (Source Serif 4, 700, `clamp(2.6rem, 5.6vw, 4.7rem)`, lh 1.02,
  ls −0.025em): Landing hero `h1` only. Rendered as a two-line break for visual
  cadence ("Six systems. / One civic core."). `text-wrap: balance`.

- **Headline** (Source Serif 4, 700, `clamp(1.9rem, 4vw, 3.4rem)`, lh 1.08,
  ls −0.02em): Cinematic scroll beat `h2` (landing) and About page section `h2`.
  `text-wrap: balance`.

- **Title** (Source Serif 4, 700, `clamp(1.15rem, 2vw, 1.5rem)`, lh 1.12,
  ls −0.015em): App card titles, module panel `h3`, About commitment headings,
  app section headings. The most frequent heading role; still Source Serif 4.

- **Body** (Inter, 400, `1rem` / 16px, lh 1.65): All prose — About body paragraphs
  (`max-width: 62ch`), landing scroll beat paragraphs (`max-width: 54ch`), app
  description text. `text-wrap: pretty` on long paragraphs. `max-width: 65ch`
  is the absolute cap; a 72ch body line is a defect.

- **Label / UI** (Inter, 500–600, `0.875rem` / 14px): App button text, badge labels,
  nav items, table column headers, form field labels.

- **Telemetry** (Geist Mono, 400, 9–11px, ls 0.10–0.32em, uppercase): HUD corner
  readouts, orbit node labels, phase tags, commitment numerals, terminal body text,
  scroll cue, kicker labels inside scroll beats. This role is deliberately narrow —
  any other context, use Inter.

**The Geist Mono Boundary Rule.** Geist Mono is the instrument chrome, not the brand
font. It appears only where the system is "speaking as a machine" — HUD telemetry,
terminal log readouts, section-code tags, keyboard shortcut labels, and tech-stack
readouts. Headings, body copy, navigation labels, and button text always use Source
Serif 4 or Inter. If a new element feels like it "needs mono to look cool," that feeling
is the wrong signal.

**The Single Display Face Rule.** Source Serif 4 plays every heading role (h1–h3) on
both pages. Differentiate heading levels through size and weight contrast, not through
font family. Two display faces on one page — adding a condensed grotesque as a "display
option" — breaks the system.

**The Weight Contrast Rule.** Adjacent typographic elements must differ by at least one
weight step. 700 heading above 400 body is correct. 600 card title above 600 description
is flat; rewrite as 700 / 400 or 600 / Inter-400.

## 4. Elevation

Two distinct elevation strategies — one per register.

**Instrument register (orbital field):** Depth is atmospheric, not structural. The fixed
Three.js canvas sits at z-index 0. Above it, in z-index order: vignette gradient (z 2)
→ orbit labels (z 13) → system chips (z 15) → HUD chrome (z 14) → nav (z 16) → module
panel (z 18) → preloader (z 100). Shadows do not exist here; depth is expressed through
the radial vignette, the `backdrop-filter: blur(8px)` on system chips (the single
justified glassmorphism usage in the system — functionally separates chips from the live
canvas behind them), and the text-shadow on cinematic beat copy.

**Platform register (cream app):** Tonal layering is the primary signal. Three steps:
cream surface (`#f4ecdb`) → card near-white (`#fcf9f2`) → raised hover (`#efe6d4`).
One structural shadow on cards (`0 1px 2px rgba(21,36,47,0.04), 0 10px 24px -16px
rgba(21,36,47,0.18)`). A stronger panel shadow (`0 18px 48px rgba(0,0,0,0.32)`) for
floating modals and drawers only. A glow shadow (`0 8px 28px -8px rgba(214,90,41,0.45)`)
under primary buttons.

**The Justified-Once Rule.** `backdrop-filter: blur(8px)` is permitted exactly once in
the system: on `.ofx-chip` in the orbital field, where it functionally isolates the
interactive chip layer from the live Three.js canvas behind it. All other uses of
glassmorphism are prohibited.

**The Flat-by-Default Rule.** App surfaces at rest carry no shadow. The card shadow
appears on cards and panels elevated against the cream surface. Floating elements
(modal, side drawer) use the panel shadow. If something needs to feel elevated, move it
up the tonal ramp first; reach for shadow only when tonal separation is insufficient.

**Z-index scale (semantic):** sticky header 20 → dropdown 30 → modal backdrop 40 →
modal 50 → toast 60 → tooltip 70. Never arbitrary values. The orbital field uses its
own numbered z-index stack (0–100) scoped within the `.ofx-root` stacking context.

## 5. Components

### Orbital CTA Button — The primary action on dark surfaces

The single entry point from the marketing world into the platform. Unmissable on the
orbital field.

- **Shape:** Gently rounded (10px, `.ofx-btn`)
- **Default:** Orange fill (`#e0662f`), white text, `padding: 13px 24px`,
  `font-weight: 600`, `font-size: 14px`. Long shadow: `0 12px 34px -14px
  rgba(224,102,47,0.9)`.
- **Hover:** Lightens to orange-lt (`#f5965c`).
- **Ghost variant:** Transparent fill, `border: 1px solid rgba(224,150,90,0.3)`,
  muted text (`#a9bac4`). Hover: border shifts to full orange, text lifts to cream.
- **Focus:** `outline: 2px solid #f5965c; outline-offset: 3px`.

### System Index Chip — Orbital field navigation

Each chip represents one of the six orbital systems. Appears as a pill bar at the
bottom of the viewport during the explore phase.

- **Shape:** Pill (`border-radius: 999px`), `min-height: 44px` (touch target)
- **Default:** Semi-transparent dark fill (`rgba(10,18,26,0.5)`), warm border
  (`rgba(150,180,196,0.18)`), `backdrop-filter: blur(8px)`, Geist Mono 10px uppercase,
  muted text.
- **Hover / Active:** Border shifts to orange, fill to `rgba(224,102,47,0.14)`, text
  to white. Left dot (8px circle) coloured in the module's own hex.
- **The Blur Exception:** The `backdrop-filter: blur(8px)` on chips is the only
  glassmorphism in the system. It exists to separate the chip bar from the live canvas
  behind it — a functional necessity, not decoration.

### Module Panel — Deep-dive on a selected orbital node

Fixed, left-anchored (`left: 48px; max-width: 430px`), slides up from `translateY(20px)`
on selection.

- **Header:** Geist Mono 11px section code (e.g. "SEC·02 // SYSTEM"), faint colour
- **Heading:** Source Serif 4 700, `clamp(2rem, 3.6vw, 2.9rem)`, near-white `#f9f3e9`
- **Description:** Inter 400, `1.04rem`, cream `0.94` opacity, `max-width: 40ch`
- **Stats:** Geist Mono 11.5px, `line-height: 2`, muted text, orange-lt values
- **Return button:** Pill shape (`border-radius: 999px`), orange tinted fill, orange
  border, transitions to full orange fill on hover
- **Module nav:** `◂ ▸` buttons, 44×44px, `border-radius: 10px`, warm line border

### HUD Telemetry — Instrument chrome on both pages

Fixed, `aria-hidden`, Geist Mono throughout. Two readout zones:
- Bottom-left (`.ofx-met`): "SIGNAL CORE // ONLINE · SYSTEMS 6/6 · LINK STABLE · MET
  HH:MM:SSZ". Bold values in gold (`#e7b052`). 10px, ls 0.16em.
- Bottom-right (`.ofx-sysid`): Section / doc identifier. Bold values in orange-lt.
- Corner brackets (`.ofx-tick`): 22×22px L-shapes, orange `0.7` opacity, `1.4px` lines.

**The HUD Discipline Rule.** HUD chrome is `aria-hidden`, `pointer-events: none`, and
cosmetic. It does not serve as navigation, convey data a user must act on, or replace
semantic landmarks. It frames the instrument world; it is not the instrument itself.

### App Primary Button — Platform actions

The standard action affordance in the logged-in platform.

- **Shape:** `border-radius: 8px`; `min-height: 40px`
- **Primary:** Orange fill (`#d65a29`), white text, `padding: 8px 16px`,
  `font-size: 0.875rem`, `font-weight: 600`. Hover: lightens to `#e2703f`, glow
  shadow activates (`0 8px 28px -8px rgba(214,90,41,0.45)`).
- **Ghost:** Transparent, `ink-soft` text (`#505962`). Hover: cream raise background.
- **Focus:** `outline: 2px solid rgba(214,90,41,0.7); outline-offset: 2px`.
- **Disabled:** `opacity: 0.5; cursor: not-allowed`.

### App Card / Data Panel

The primary container for structured content in the platform.

- **Surface:** Card near-white (`#fcf9f2`), `border: 1px solid #e7dcc7`,
  `border-radius: 8px`, card shadow.
- **Header zone:** `border-bottom: 1px solid #e7dcc7; padding: 20px`. Title in
  Source Serif 4 700 at title scale, deep navy ink. Optional right-aligned action slot.
- **Body zone:** `padding: 20px`. Body copy in Inter 400, body-slate (`#505962`).
- **The No-Nesting Rule.** Nested cards are always wrong. Use tonal background variation
  (`#efe6d4` on cream, `#1d3a49` on navy) for inset sub-sections.

### Semantic Badges

Five roles, all pill shape (`border-radius: 999px`), `padding: 4px 10px`,
Inter 600 at `0.75rem`. Colour is semantic, never decorative.

| Variant | Fill | Text | Meaning |
|---------|------|------|---------|
| orange | `#d65a29` at 10% | `#d65a29` | Active module, primary signal |
| amber | `#d99a3c` at 10% | `#d99a3c` | Caution, in-progress, needs attention |
| rose | `#ee6c7a` at 10% | `#ee6c7a` | Critical, error, failed |
| sage | `#4f8a5b` at 10% | `#4f8a5b` | Risk Graph module identity |
| blue | `#71a7ff` at 10% | `#71a7ff` | Informational, external reference |

**The Semantic-Only Rule.** Badge colour is never applied for visual variety. If a badge
doesn't map to one of these five roles, render it in the ink-faint / paper-raise neutral
palette without an accent fill.

### Architecture SVG — The About page centrepiece

A live CSS-animated data-flow diagram (`stroke-dashoffset` on `.abt-flow`). Four-colour
module coding consistent with orbital node colours. `role="img" aria-label="..."` for
screen reader access. `prefers-reduced-motion` strips all animation and removes
`stroke-dasharray` so the full lines are visible at rest.

Do not replace this with a static image or a third-party diagram library. The SVG is
hand-authored with custom `feGaussianBlur` glow, coloured nodes, and diegetic labels
at the system's actual technical layer names.

## 6. Do's and Don'ts

### Do:

- **Do** use `#e0662f` (Orbital Glow Orange) for all marketing-page interactive
  elements, and `#d65a29` (Brand Signal Orange) for all app-register interactive
  elements. The slight tonal difference is optical compensation, not a second accent.
- **Do** confine Geist Mono to instrument chrome roles: HUD readouts, telemetry labels,
  terminal body text, orbital node codes, section phase tags. Inter handles everything
  else including button labels, nav items, and body copy.
- **Do** use Source Serif 4 for every heading level (h1–h3) on both pages. Weight and
  size differentiate levels; do not introduce a second display face.
- **Do** apply `text-wrap: balance` to h1–h3 and `text-wrap: pretty` to long body
  paragraphs. Cap body line length at 65ch maximum.
- **Do** honour `prefers-reduced-motion` on every animation. All orbital CSS animations
  (`.abt-flow`, `.ofx-pulse`, `.ofx-ring`) strip to `animation: none` in reduced-motion
  context. The Three.js orbital field uses a `reducedMotion` flag from `matchMedia`.
- **Do** respect the semantic z-index scale for any new modal or overlay:
  sticky 20 → dropdown 30 → modal-backdrop 40 → modal 50 → toast 60 → tooltip 70.
- **Do** pair every badge or status colour with a text label or icon. Colour alone must
  never be the only indicator of state.
- **Do** attribute or restructure unattributed quotations on the About page.
  "Online harm leaves a trace…" requires a source credit or must be restructured as a
  first-person statement.
- **Do** use `--line: rgba(224,150,90,0.3)` as the warm amber hairline for all section
  dividers on the About page. It matches the landing's `var(--line)` exactly.

### Don't:

- **Don't** introduce CRT scanlines, phosphor-glow gradients, or `repeating-linear-gradient`
  phosphor textures anywhere in the marketing or app surfaces. PRODUCT.md explicitly bans
  the hacker/terminal aesthetic lane. The `.ofx-scan` rule has been removed; do not
  reinstate it.
- **Don't** use `border-left` or `border-right` greater than 1px as a coloured accent
  stripe on any card, list item, callout, quote, or nav item. Rewrite with full border,
  background tint, leading number/icon, or no border at all.
- **Don't** use gradient text (`background-clip: text` + gradient). Single solid colour;
  emphasis via weight or size only.
- **Don't** apply glassmorphism (`backdrop-filter` + translucent surface) anywhere except
  the orbital system chips (`.ofx-chip`). That one use is functionally justified; all
  others are decoration and prohibited.
- **Don't** use purple-to-pink gradients, glowing orb effects, or "AI-powered" hero
  copy. Startup gradient purple is explicitly rejected (PRODUCT.md anti-reference).
- **Don't** use warm sand, cream-tinted, or generic AI-warm backgrounds in new app
  sections. `#f4ecdb` is the cream; any value with a warmer or more saturated OKLCH hue
  than it is drifting toward the generic AI-cream anti-pattern.
- **Don't** put a numbered eyebrow above every section (`01 / 02 / 03`). Commitment
  numerals on the About page are a real 1–4 sequence with informational ordering — one
  deliberate use. A numbered eyebrow on a new section without a real sequence rationale
  is AI-grammar scaffolding.
- **Don't** add `.ofx-scan` or any CRT scanline layer back to `.abt-bg`. The vignette
  (`radial-gradient`) and the Three.js orbital field (on the landing) already provide
  all required atmosphere. The scanline was a hacker-aesthetic citation; its absence is
  the correct state.
- **Don't** use colour as the sole indicator of a system state. Every semantic badge,
  status chip, and anomaly flag pairs its colour with a text label, an icon, or a shape.
- **Don't** use green-on-black, terminal green, or phosphor-teal anywhere. The dark
  orbital field is `#070f17` with warm orange — not green-on-black. The orbital/telemetry
  aesthetic is justified by the product's signal/observatory metaphor; the green terminal
  lane is not, and PRODUCT.md rejects it by name.
- **Don't** use an identical card grid (`n × [icon / heading / body]` uniform cells)
  for more than one section. The phase grid on About is the system's existing eight-cell
  grid; introducing a second one on any new screen needs explicit justification.
- **Don't** use arbitrary box-shadow values. The three permitted shadow tokens are
  `shadow-card`, `shadow-panel`, and `shadow-glow`. If a new element needs a shadow,
  use the nearest one — do not invent a fourth.
