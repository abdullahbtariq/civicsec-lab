# Product

## Register
both

## Users

**Primary — Platform users**
Civic security analysts, NGO security leads, and small-organisation IT staff responsible
for monitoring and responding to cyber, data-privacy, and platform threats without
enterprise tooling budgets. This range spans trained SOC analysts to non-technical
programme managers with shared responsibility for digital security.

**Secondary — Portfolio reviewers**
Technical recruiters and evaluators assessing full-stack, security engineering, and
civic technology competence through the public-facing site and codebase.

**Language constraint**
All copy and UI labels must serve both audiences simultaneously: plain enough for an NGO
programme manager to act on without asking a colleague, precise enough for a security
analyst to trust without second-guessing the terminology. Never use jargon that excludes
the non-technical reader; never over-simplify language to the point that an analyst
would distrust the output.

## Product Purpose
CivicSec Lab closes the resource gap between small civic organisations and the cyber,
data, and platform threats they face. Six integrated modules — ThreatBoard, LogLens,
DataPrivacy Doctor, Misinformation Observatory, Civic Risk Graph, and IncidentFlow —
share one risk model and one response workflow, replacing the patchwork of disconnected
tools that most civic teams rely on.

For portfolio purposes, the platform demonstrates full-stack engineering across
Django/DRF API design, NLP, ML anomaly detection, graph visualisation, and interactive
3D UI.

## Brand Personality
Authoritative, civic, precise. The voice of serious public-interest infrastructure —
not a startup, not a government bureau. Closer to investigative journalism than security
vendor pitch decks. The platform earns trust through clarity and observable evidence,
not confident assertions.

## Anti-references
- **Hacker / terminal dark** — green on black, phosphor-glow effects, dense code
  overlays, connecting-node animations, CLI aesthetics. The aesthetic the platform's
  subject matter most naturally suggests, and therefore the one it must most
  deliberately avoid.
- **Startup gradient purple** — generic AI product look, glowing orbs on purple-to-pink
  gradients, hyperbolically confident copy, "AI-powered" hero text.
- **Generic warm AI cream** — `oklch(97% 0.01 60)` tinted surfaces, warm sand neutrals,
  the default "friendly AI" palette of 2024–2026.

## Design Principles
1. **Civic authority over spectacle** — every design decision should feel like The
   Economist or a well-edited government transparency report, not a security vendor
   pitch deck. Restraint is not absence of craft.
2. **Precision in language** — cautious, observable language throughout: signals,
   patterns, clusters, events — not conclusions drawn on behalf of the user. The
   platform surfaces evidence; humans make decisions.
3. **Dual-audience legibility** — copy, labels, and empty states must be readable by a
   non-technical NGO programme manager and trusted by a trained security analyst.
   Clarity is not the same as simplification.
4. **Unified design language** — the landing page and app share the same typographic and
   colour family (civic teal, OKLCH hue ≈162°); only the lightness register changes.
   A user moving from the marketing site to the platform should feel continuity, not a
   context switch.
5. **Data clarity over decoration** — every visual element serves comprehension first.
   Colour is semantic; decoration is earned. If an element doesn't carry information or
   establish hierarchy, it doesn't exist.

## Accessibility & Inclusion
WCAG AA minimum for all text and interactive components. `prefers-reduced-motion`
respected in all animations. No information conveyed by colour alone — always paired
with label, icon, or pattern. Keyboard navigable throughout. Body text minimum 16px.
Focus indicators visible at all times.
