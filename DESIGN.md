---
name: CivicSec Lab
description: Open-source civic security intelligence platform for small organisations and NGOs.
colors:
  # ── App register (dark) ──────────────────────────────────────────────────────
  app-surface: "#111315"
  app-panel: "#181b1f"
  app-hover: "#20252b"
  app-line: "#2b3036"
  app-text: "#f5f7fa"
  app-muted: "#a7b0bb"
  app-teal: "#43d9ad"
  app-amber: "#f4b860"
  app-rose: "#ee6c7a"
  app-blue: "#71a7ff"
  # ── Landing register (light) ─────────────────────────────────────────────────
  landing-base: "#f1f6f4"
  landing-elevated: "#ffffff"
  landing-alt: "#eaf2ef"
  landing-border: "#cddad6"
  landing-ink: "#0e1d18"
  landing-secondary: "#2d4a42"
  landing-muted: "#6a8880"
  landing-faint: "#c0d4cf"
  landing-cta: "#0a5740"
  landing-cta-text: "#d4ede7"
  landing-cta-muted: "#7ab8a8"
  # ── Shared brand ─────────────────────────────────────────────────────────────
  brand-amber: "#f4b860"
  brand-amber-text: "#1a0e00"
typography:
  display:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 6.8vw, 5.8rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.5vw, 2.8rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.26em"
    lineHeight: 1.4
rounded:
  md: "8px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.app-teal}"
    textColor: "#091311"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#6ee8c4"
    textColor: "#091311"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.app-hover}"
    textColor: "{colors.app-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.app-muted}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "#ee6c7a26"
    textColor: "{colors.app-rose}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-cta-landing:
    backgroundColor: "{colors.brand-amber}"
    textColor: "{colors.brand-amber-text}"
    rounded: "{rounded.md}"
    padding: "12px 28px"
  card:
    backgroundColor: "{colors.app-panel}"
    rounded: "{rounded.md}"
    padding: "20px"
  badge-teal:
    backgroundColor: "#43d9ad1a"
    textColor: "{colors.app-teal}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-amber:
    backgroundColor: "#f4b8601a"
    textColor: "{colors.app-amber}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-rose:
    backgroundColor: "#ee6c7a1a"
    textColor: "{colors.app-rose}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-neutral:
    backgroundColor: "{colors.app-hover}"
    textColor: "{colors.app-muted}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  input:
    backgroundColor: "#111418"
    textColor: "{colors.app-text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: CivicSec Lab

## 1. Overview

**Creative North Star: "The Civic Dispatch"**

CivicSec Lab operates at the intersection of investigative journalism and security
operations — precise, credible, and built for people who need to act on evidence.
The visual system reflects this: structured without rigidity, technical without
opacity, civic without being bureaucratic. Every design decision asks: *would this
feel at home in The Economist's digital interface or a well-designed government
transparency tool?* If the honest answer is "startup landing page" or "security vendor
pitch deck," it goes back to the drawing board.

Two tonal registers share one typographic and hue family — civic teal, OKLCH hue ≈162°.
The landing/marketing surface is light: a teal-tinted off-white (`#f1f6f4`) that reads
like a well-designed policy brief. The product surface is dark: deep near-blacks
(`#111315`) that create a focused, low-distraction analytical environment. Moving
between them should feel like opening a trusted publication's website and then its
reading interface — the same voice, different lighting conditions, no context switch.

Motion is intentional and minimal in the app (state feedback only), choreographed on
the landing page (scroll-driven narrative, Framer Motion with expo-out easing). All
animations include a `prefers-reduced-motion` fallback. Section spacing is generous:
`py-24` to `py-32` on landing (96–128px vertical rhythm), `gap-4` to `gap-6` in the
app shell. Spacing varies for rhythm; identical gaps are a tell.

**Key Characteristics:**
- Two-register system: light brand surface + dark product surface, unified by hue
- Restrained colour strategy: teal as the single accent at ≤10% of any screen
- Semantic colour: every accent use has a consistent meaning across every screen
- Typography pairing on contrast axis: geometric Syne (display) + humanist Inter (body)
- Tonal layering for depth in the app; structural shadow on cards only
- Dual-audience copy: readable by an NGO programme manager, trusted by a security analyst

## 2. Colors: The Civic Teal System

One hue family (OKLCH ≈162°) expressed at opposite lightness poles. The two
registers invert on lightness, never on hue or chroma direction.

### Primary (app register — dark)

- **Live Signal Teal** (`#43d9ad`): The only interactive accent in the dark app.
  Active nav states, focus rings, status confirmations, primary CTA buttons, progress
  indicators. Used at full opacity for text and icons; at 10% for tinted backgrounds;
  at 40% for hairline borders. Its rarity is what makes it legible as a signal.

- **Caution Amber** (`#f4b860`): Warning states, in-progress indicators, non-zero
  metric values requiring attention. In stat cards: the number turns amber when the
  count is non-zero and the tone is "active". Never decorative.

- **Critical Rose** (`#ee6c7a`): Error states, destructive actions, critical-severity
  risk events, failed operations. In stat cards: the number turns rose when the count
  is non-zero and the tone is "hot". Never decorative.

- **Reference Blue** (`#71a7ff`): Informational callouts, external links, metadata
  badges. The fourth semantic role; use only when the other three don't apply.

### Neutral (app register — dark)

- **Abyss** (`#111315`): Page canvas. The deepest surface; everything sits on or
  above it. Never use as a card background.

- **Elevated Panel** (`#181b1f`): Card and data panel background. One perceptible
  tone above Abyss.

- **Interaction Hover** (`#20252b`): Hover and selected-state surfaces, secondary
  button background, input fill in sidebar. One tone above Panel.

- **Structural Slate** (`#2b3036`): All borders and dividers throughout the app.
  The single border colour; do not introduce a second.

- **Primary Text** (`#f5f7fa`): All headings and body copy on dark surfaces.

- **Secondary Text** (`#a7b0bb`): Supporting labels, metadata, placeholder text,
  sidebar section headers, muted descriptions.

### Primary (landing register — light)

- **Forest Teal** (`#0a5740`): Logo mark, nav sign-in eyebrow context, the drenched
  CTA section background. Not used as a button or link accent in the light register
  (amber holds that role). Appears here as the brand anchor.

- **Press Amber** (`#f4b860`): The single CTA button colour on both registers.
  Background on all primary action buttons. Text on these buttons: `#1a0e00`.

### Neutral (landing register — light)

- **Editorial Base** (`#f1f6f4`): Page background. Teal-tinted near-white
  (tint toward hue ≈162°, not toward warm). Not cream, not paper, not sand.

- **Clean Elevated** (`#ffffff`): Card and panel backgrounds on light.

- **Tinted Alt** (`#eaf2ef`): Alternating section background (How It Works, etc.).

- **Hairline Border** (`#cddad6`): Dividers and card borders on light.

- **Deep Ink** (`#0e1d18`): All headings and primary body copy on light surfaces.

- **Editorial Secondary** (`#2d4a42`): Supporting text and subheadings on light.

- **Quiet Muted** (`#6a8880`): Captions, nav links, metadata labels on light.

- **Faint Decorative** (`#c0d4cf`): Display numerals used as background ornament.

### Module accent colours

Each of the six modules has its own accent for identity — used only for that module's
icon background tint and accent highlights, never for semantic status.

| Module | Light accent | Dark accent |
|--------|-------------|-------------|
| ThreatBoard | `#8c4e0a` | `#c4821a` |
| LogLens | `#5a3a7a` | `#7a5a9a` |
| DataPrivacy Doctor | `#1a5a7a` | `#2a7e9a` |
| Misinformation Observatory | `#6a5010` | `#9a7a2a` |
| Civic Risk Graph | `#1d7a64` | `#2a9e82` |
| IncidentFlow | `#823028` | `#b05040` |

**The One-Accent Rule.** In the dark app, Live Signal Teal (`#43d9ad`) is the only
colour used for interactive and status roles. Amber and rose appear only when their
specific semantic condition is met (warning, critical). Two accents on the same screen
without semantic distinction is a defect.

**The Register Inversion Rule.** Both registers use OKLCH hue ≈162°. The inversion
is lightness only. Do not shift the hue toward warm or cool when moving between
registers. The tint on `#f1f6f4` is toward teal, not toward cream.

## 3. Typography: Geometric Authority, Humanist Readability

**Display Font:** Syne (variable weight 400–800, Google Fonts CDN)
**Body Font:** Inter (400, 500, 600, 700, system-ui stack)

**Character:** A contrast pairing on the geometric/humanist axis. Syne's upright,
square-cornered geometry carries authority and identity — the voice of the platform.
Inter's humanist warmth handles readability and data at any size. They share a neutral
undertone that prevents either from dominating. Never italic on Syne (it has no italic
cut). Never pair in similar weights on the same line.

### Hierarchy

- **Display** (Syne 700, `clamp(2.8rem, 6.8vw, 5.8rem)`, lh 1.05, ls −0.02em):
  Landing hero headline only. One per page. `text-wrap: balance`.

- **Headline** (Syne 600–700, `clamp(2rem, 3.5vw, 2.8rem)`, lh 1.15, ls −0.01em):
  Section h2 headings on the landing page. `text-wrap: balance`.

- **Title** (Inter or Syne 600, `1.125rem`, lh 1.3): Step titles, card headers in app,
  module names (Syne); utility section headers, form group labels (Inter).

- **Body** (Inter 400, `1rem`/16px, lh 1.6): All prose. Landing: max 65ch.
  App tables and data lists: unconstrained. `text-wrap: pretty` on long paragraphs.

- **Label** (Inter 500–600, `0.875rem`, lh 1.4): UI labels, nav items, button text,
  badge text, table column headers.

- **Caption / Eyebrow** (Inter 600, `0.75rem`, ls 0.26em, uppercase): Section
  eyebrow labels in the current register's teal only. One deliberate kicker per major
  section where it carries real navigational value. Not reflexive scaffolding on every
  block.

**The Syne Boundary Rule.** Syne is reserved for display headings (h1), section
headlines (h2), the CivicSec Lab wordmark, and module names. Everything else — body
copy, metadata, captions, table data, form labels, nav items, badges — uses Inter.
When in doubt, Inter.

**The Weight Contrast Rule.** Adjacent typographic elements must differ by at least
one weight step. A 600-weight label next to a 600-weight heading is not hierarchy.
The standard pairing: 700 heading above 400 body; 600 card title above 400 description.

## 4. Elevation

The system uses **tonal layering** as its primary depth signal in the app register,
with one structural shadow for floating panels. In the landing register, section
separation is achieved through alternating background colours — no shadows on
marketing surfaces.

The app's three-step tonal ramp — Abyss (`#111315`) → Elevated Panel (`#181b1f`)
→ Interaction Hover (`#20252b`) — provides perceptible but understated depth. Each
step is visible without being dramatic. The ramp is the elevation system for most
surfaces; reach for shadow only when tonal separation is insufficient.

Glassmorphism (blur + translucency used as a surface treatment) is prohibited.
Backdrop blur appears only as a purposeful functional treatment on modals and the
scrolled nav header — never as decoration on cards or panels.

### Shadow vocabulary

- **Panel Lift** (`box-shadow: 0 18px 48px rgba(0,0,0,0.24)`): Deep ambient shadow
  on cards and data panels, elevating them against the Abyss background. Applied via
  the `shadow-panel` Tailwind token. Structural, not decorative.

- **Focus Glow** (`ring-2 ring-civic-teal/70`): Focus rings on all interactive
  elements — buttons, inputs, links, nav items. Teal glow, always consistent.

- **Hero Card Shadow** (`box-shadow: 0 40px 80px rgba(10,30,24,0.16)`): Used only
  on the landing page's dark app preview card. Scaled up for hero context.

**The Flat-By-Default Rule.** Surfaces are flat at rest. Panel Lift appears only on
cards and floating panels elevated above the Abyss layer. Do not add `box-shadow` to
list items, table rows, inline badges, nav links, or horizontal dividers. If something
needs to feel elevated, move it up the tonal ramp first.

## 5. Components

### Buttons — Confident and direct

Primary actions are immediately visible. Secondary and ghost variants recede into the
surface; they support rather than compete. All variants share the same height, radius,
focus treatment, and disabled state.

- **Shape:** Gently rounded corners (8px / `rounded-lg`)
- **Height:** `min-h-10` (40px) for all app buttons; `min-h-12` (48px) for landing CTAs
- **App Primary:** Bright civic teal bg (`#43d9ad`), near-black text (`#091311`),
  `px-4 py-2 text-sm font-semibold`. Hover: lightens to `#6ee8c4`.
- **Landing CTA:** Amber bg (`#f4b860`), near-black amber text (`#1a0e00`),
  `px-7 py-3 text-sm font-semibold`. Full-width on mobile.
- **Secondary:** Hover-surface bg (`#20252b`), primary text, Structural Slate border.
  Used for supporting and reversible actions.
- **Ghost:** Transparent bg, Secondary Text colour. Hover: reveals hover surface,
  text lifts to white. Used for tertiary actions, icon-only toolbar controls.
- **Danger:** Low-opacity rose bg (`#ee6c7a` at 15% alpha), rose text.
  Border at 50% rose. Used only for confirmed destructive operations — never
  speculatively as visual variety.
- **Focus:** `ring-2 ring-civic-teal/70 focus:outline-none` — consistent across all
  variants. No per-variant focus colour.
- **Disabled:** `opacity-50 cursor-not-allowed` — all variants.

### Badges / Status chips — Semantic only

Five roles, expressed as pill chips with a hairline tinted border. Colour is a state
signal, never decoration. Shape: `rounded-full min-h-7 px-2.5 py-1 text-xs font-semibold`.

| Variant | Background | Border | Text | Semantic meaning |
|---------|-----------|--------|------|-----------------|
| neutral | `#20252b` | `#2b3036` | `#a7b0bb` | No active state / label only |
| teal | teal/10 | teal/40 | teal | Confirmed, active, success, live |
| amber | amber/10 | amber/40 | amber | Warning, in progress, caution |
| rose | rose/10 | rose/40 | rose | Critical, error, closed with issue |
| blue | blue/10 | blue/40 | blue | Informational, reference |

**The Semantic-Only Rule.** Badge colour is never applied for visual variety. If a
badge doesn't map to one of the five semantic roles, use neutral.

### Cards / Data panels

The primary container for structured content in the app. Cards have one clear content
boundary — never nest a card inside a card.

- **Surface:** Elevated Panel (`#181b1f`)
- **Border:** 1px Structural Slate (`#2b3036`), `rounded-lg`
- **Shadow:** Panel Lift (`shadow-panel`)
- **Card header:** `border-b border-civic-line p-5`; title `text-lg font-semibold
  text-white`; optional description `text-sm text-civic-muted mt-1`; optional action
  slot right-aligned
- **Card content:** `p-5` default padding
- **The No-Nesting Rule.** Nested cards are always wrong. Use tonal background
  variation (`bg-[#14181d]`) for visually inset sub-sections.

### Inputs / Text fields — Teal-active

Minimal and focused. The entire perimeter activates on focus.

- **Default:** Dark fill (`#111418`), `border-civic-line`, `rounded-lg`,
  `text-sm text-white`, placeholder `text-civic-muted`
- **Focus:** Border shifts to full civic teal; `ring-2 ring-civic-teal/20` inner glow
- **Error:** Rose border + `ring-2 ring-civic-rose/20` (mirrors focus pattern)
- **Height:** `min-h-10` (40px)
- **Disabled:** `opacity-50 cursor-not-allowed`

### Sidebar navigation — Restrained active states

The sidebar communicates hierarchy through colour and weight alone; no structural
decoration.

- **Active state:** `bg-civic-teal/10 text-civic-teal` — tinted background only.
  No side stripe, no indicator bar.
- **Inactive:** `text-civic-muted`, lifts to `text-white bg-[#20252b]` on hover.
- **Section labels:** `text-xs font-semibold uppercase tracking-wide text-civic-muted/60`
  — structural organisers, not design elements. At 60% opacity they barely register.
- **Icons:** `h-4 w-4 shrink-0`, always paired with a text label. Never icon-only in
  the main nav.
- **User card (bottom):** Initials avatar in teal-tinted circle, full name, org name,
  role badge, sign-out link. Separated from nav by a hairline border.

### Landing page sections — The Civic Dispatch layout

Section sequence: Hero → Challenge → Platform → How It Works → Trust → CTA.

- **Hero:** Light bg, split layout. Editorial copy left (max 52ch body); dark WebGL
  app preview card right (rounded-2xl, Panel Lift shadow, window chrome bar).
- **Challenge:** Stat cards on light base. Large display number in module accent;
  caption in Quiet Muted.
- **Platform:** Module list on white elevated surface. Flex row: faint mono index
  number → 36×36 icon box (tinted bg, hairline border) → title + description → teal
  arrow (opacity 0, lifts on row hover).
- **How It Works:** Tinted alt background (`#eaf2ef`). Four-step grid. Step numbers
  are real sequence numbers (the order carries information) — not decorative 01/02/03
  eyebrows.
- **Trust:** White elevated. Two-col: editorial copy left, four principle cards right.
  Principle cards: horizontal 2px teal accent bar at top (not side stripe), title +
  body.
- **CTA:** Drenched Forest Teal (`#0a5740`). Amber button. Teal-tinted text
  (`#d4ede7`). One section, one ask.

## 6. Do's and Don'ts

### Do:

- **Do** use `#43d9ad` (Live Signal Teal) exclusively for active states, focus rings,
  confirmations, and primary CTAs in the app. Its rarity is the signal.
- **Do** apply semantic colour consistently: teal = active/confirmed, amber =
  caution/warning, rose = critical/error, blue = informational. The same colour means
  the same thing on every screen in the app.
- **Do** lift surfaces with tonal layers first (Abyss → Panel → Hover) before adding
  `box-shadow`. Shadow is a last resort for elevation.
- **Do** write all copy — labels, empty states, error messages, tooltips — to the
  dual-audience standard: plain enough for an NGO programme manager, precise enough
  for a security analyst. If a label works for only one audience, rewrite it.
- **Do** use `text-wrap: balance` on h1–h3 headings and `text-wrap: pretty` on body
  prose paragraphs.
- **Do** honour `prefers-reduced-motion` on every animation. Provide a crossfade
  or instant-transition fallback; never silently omit the animation and leave content
  in a transitional state.
- **Do** restrict Syne to display headings, section h2, the wordmark, and module
  names. Inter handles everything else.
- **Do** apply `ring-2 ring-civic-teal/70` focus treatment consistently across all
  interactive elements — buttons, inputs, links, nav items.
- **Do** vary spacing for rhythm. Adjacent sections with identical gap values is a
  scaffolding tell.

### Don't:

- **Don't** use `border-left` or `border-right` greater than 1px as a coloured accent
  stripe on any card, list item, callout, or nav item. Rewrite with background tint,
  full border, leading icon, or horizontal accent bar.
- **Don't** reach for the hacker / terminal aesthetic — green on black, phosphor glow,
  connecting-node animations, dense code overlays. This is the platform's most
  tempting anti-pattern given its subject matter. The WebGL particle network on the
  landing page is the single deliberate exception; it is not a default to extend.
- **Don't** use purple-to-pink gradients, glowing orb effects, or "AI-powered" hero
  copy. Startup gradient purple is explicitly banned.
- **Don't** use warm sand, cream, or paper-tinted backgrounds. The landing base
  (`#f1f6f4`) is tinted toward teal (OKLCH hue ≈162°), not toward warmth. Any token
  name containing "cream", "sand", "paper", "warm", "ivory", or "bone" is a tell.
- **Don't** use colour as the sole indicator of state. Always pair colour with a
  label, icon, shape change, or typographic treatment.
- **Don't** apply `box-shadow` decoratively. Panel Lift is the only shadow in the
  app register. It appears only on floating card panels.
- **Don't** use gradient text (`background-clip: text` + gradient). Single solid
  colour; emphasis via weight or size.
- **Don't** apply glassmorphism as a default surface treatment. Backdrop blur is
  permitted only for the scrolled nav header and modal backdrop overlays — never on
  cards or data panels.
- **Don't** put an eyebrow kicker above every section. The caption eyebrow is one
  deliberate choice where it carries navigational value — not reflexive scaffolding.
- **Don't** use arbitrary z-index values. The semantic z-index scale:
  sticky header (20) → dropdown (30) → modal backdrop (40) → modal (50) →
  toast (60) → tooltip (70). Never use 999 or 9999.
- **Don't** nest cards. If a sub-section needs visual separation inside a card, use
  a tonal background tint (`#14181d`) — not another card.
