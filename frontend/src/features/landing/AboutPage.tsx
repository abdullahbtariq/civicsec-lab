// About page — rebuilt on the orbital/instrument theme.
// Shares the ofx- token layer and nav/HUD chrome from the landing page.
// The centerpiece is a live animated SVG architecture graph.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ORBITAL_MODULES } from "./orbital/modules";
import { LandingNav } from "./LandingNav";
import "./orbital/orbital.css";
import "./about.css";

// ── Architecture SVG ──────────────────────────────────────────────────────────
// Data-flow diagram: 4 sources → 4 analysis modules → Shared Risk Layer → outputs.
// Animated with CSS stroke-dashoffset; reduced-motion strips the animation.
// Fully accessible via role="img" + aria-label.

const SOURCES = [
  { id: "kev",   label: "CVE / KEV Feed", x: 115 },
  { id: "login", label: "Login Logs",     x: 273 },
  { id: "csv",   label: "CSV Datasets",   x: 467 },
  { id: "posts", label: "Public Posts",   x: 625 },
] as const;

// Four analysis modules (ThreatBoard, LogLens, Privacy, Observatory)
const ARCH_MODS = [
  { id: "tb", label: "ThreatBoard",    hex: "#e7b052", x: 115 },
  { id: "ll", label: "LogLens",        hex: "#71a7ff", x: 273 },
  { id: "dp", label: "Privacy Doctor", hex: "#5b8def", x: 467 },
  { id: "ob", label: "Observatory",    hex: "#e0662f", x: 625 },
] as const;

const RISK_CX = 370; // risk layer centre x
const RISK_Y  = 292; // risk layer top

function ArchGraph() {
  const SY  = 54;  // source row baseline
  const MY  = 184; // module row baseline
  const OY  = 388; // output row baseline

  return (
    <svg
      viewBox="0 0 740 426"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="CivicSec Lab architecture: four data sources (CVE/KEV feed, login logs, CSV datasets, public posts) feed four analysis modules (ThreatBoard, LogLens, Privacy Doctor, Observatory), which all emit into a shared risk event layer, then into the Civic Risk Graph and IncidentFlow."
      className="abt-arch-svg"
    >
      <defs>
        <filter id="aglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── ROW 1: DATA SOURCES ─────────────────────────── */}
      {SOURCES.map((s) => (
        <g key={s.id}>
          <rect
            x={s.x - 66} y={SY - 17} width={132} height={30} rx={5}
            fill="rgba(12,26,38,0.9)"
            stroke="rgba(169,186,196,0.18)" strokeWidth={1}
          />
          <text
            x={s.x} y={SY + 1}
            textAnchor="middle"
            fill="#7d92a0"
            fontSize={9}
            fontFamily="Geist Mono,monospace"
            letterSpacing="0.09em"
          >
            {s.label.toUpperCase()}
          </text>
        </g>
      ))}

      {/* ── SOURCE → MODULE LINES (vertical, animated) ─── */}
      {ARCH_MODS.map((m, i) => (
        <line
          key={m.id}
          x1={SOURCES[i].x} y1={SY + 13}
          x2={m.x}          y2={MY - 18}
          stroke={m.hex}
          strokeWidth={1.4}
          strokeOpacity={0.38}
          className={`abt-flow d${i + 1}`}
        />
      ))}

      {/* ── ROW 2: ANALYSIS MODULES ─────────────────────── */}
      {ARCH_MODS.map((m) => (
        <g key={m.id}>
          <rect
            x={m.x - 70} y={MY - 20} width={140} height={38} rx={8}
            fill={`${m.hex}1c`}
            stroke={`${m.hex}55`} strokeWidth={1.3}
          />
          {/* coloured dot */}
          <circle cx={m.x - 52} cy={MY} r={4} fill={m.hex} filter="url(#aglow)" />
          <text
            x={m.x - 42} y={MY + 4}
            fill={m.hex}
            fontSize={10.5}
            fontFamily="Geist Mono,monospace"
            fontWeight="500"
          >
            {m.label}
          </text>
        </g>
      ))}

      {/* ── MODULE → RISK LAYER (converging diagonals) ─── */}
      {ARCH_MODS.map((m, i) => (
        <line
          key={m.id}
          x1={m.x}     y1={MY + 18}
          x2={RISK_CX} y2={RISK_Y}
          stroke={m.hex}
          strokeWidth={1.3}
          strokeOpacity={0.4}
          className={`abt-flow d${i + 1}`}
        />
      ))}

      {/* ── SHARED RISK EVENT LAYER ─────────────────────── */}
      <rect
        x={RISK_CX - 220} y={RISK_Y}
        width={440} height={42} rx={10}
        fill="rgba(224,102,47,0.09)"
        stroke="rgba(224,102,47,0.38)" strokeWidth={1.3}
      />
      <text
        x={RISK_CX} y={RISK_Y + 14}
        textAnchor="middle"
        fill="#e0662f"
        fontSize={9.5}
        fontFamily="Geist Mono,monospace"
        letterSpacing="0.2em"
        fontWeight="600"
      >
        SHARED RISK EVENT LAYER
      </text>
      <text
        x={RISK_CX} y={RISK_Y + 28}
        textAnchor="middle"
        fill="#7d92a0"
        fontSize={8}
        fontFamily="Geist Mono,monospace"
        letterSpacing="0.06em"
      >
        RiskEvent · EvidenceItem · ActionRecommendation
      </text>

      {/* ── RISK LAYER → OUTPUTS (diverging) ───────────── */}
      <line
        x1={RISK_CX - 90} y1={RISK_Y + 42}
        x2={176}           y2={OY - 18}
        stroke="#5f8c6e" strokeWidth={1.3} strokeOpacity={0.45}
        className="abt-flow d5"
      />
      <line
        x1={RISK_CX + 90} y1={RISK_Y + 42}
        x2={564}           y2={OY - 18}
        stroke="#ee6c7a" strokeWidth={1.3} strokeOpacity={0.45}
        className="abt-flow d6"
      />

      {/* ── ROW 3: OUTPUTS ──────────────────────────────── */}
      {/* Civic Risk Graph */}
      <rect
        x={90} y={OY - 18} width={172} height={38} rx={8}
        fill="rgba(95,140,110,0.13)"
        stroke="rgba(95,140,110,0.42)" strokeWidth={1.3}
      />
      <circle cx={108} cy={OY} r={4} fill="#5f8c6e" filter="url(#aglow)" />
      <text x={118} y={OY + 2} fill="#5f8c6e" fontSize={10.5}
        fontFamily="Geist Mono,monospace" fontWeight="500">Civic Risk Graph</text>
      <text x={118} y={OY + 15} fill="#7d92a0" fontSize={8}
        fontFamily="Geist Mono,monospace">connected intelligence</text>

      {/* IncidentFlow */}
      <rect
        x={478} y={OY - 18} width={172} height={38} rx={8}
        fill="rgba(238,108,122,0.13)"
        stroke="rgba(238,108,122,0.42)" strokeWidth={1.3}
      />
      <circle cx={496} cy={OY} r={4} fill="#ee6c7a" filter="url(#aglow)" />
      <text x={506} y={OY + 2} fill="#ee6c7a" fontSize={10.5}
        fontFamily="Geist Mono,monospace" fontWeight="500">IncidentFlow</text>
      <text x={506} y={OY + 15} fill="#7d92a0" fontSize={8}
        fontFamily="Geist Mono,monospace">response &amp; closure</text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function AboutPage() {
  const [clock, setClock] = useState("--:--:--Z");

  // Force the navy background (app shell is cream).
  useEffect(() => {
    const prevBody = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    document.body.style.background = "#070f17";
    document.documentElement.style.background = "#070f17";
    return () => {
      document.body.style.background = prevBody;
      document.documentElement.style.background = prevHtml;
    };
  }, []);

  // Live mission-elapsed clock.
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19) + "Z");
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="ofx-root abt-root">
      {/* Depth gradient background */}
      <div className="abt-bg" aria-hidden="true" />

      {/* Skip link */}
      <a href="#abt-main" className="ofx-skip">Skip to main content</a>

      {/* Instrument HUD chrome — decorative, matches landing */}
      <div className="ofx-hud" aria-hidden="true">
        <div className="ofx-tick ofx-tl" /><div className="ofx-tick ofx-tr" />
        <div className="ofx-tick ofx-bl" /><div className="ofx-tick ofx-br" />
        <div className="ofx-met">
          SIGNAL CORE // <b>ONLINE</b><br />
          CIVIC-SEC · ABOUT<br />
          MET <b>{clock}</b>
        </div>
        <div className="ofx-sysid">
          MISSION LOG<br />
          DOC <b>ABOUT-01</b>
        </div>
      </div>

      <LandingNav />

      <main id="abt-main">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="abt-hero">
          <div className="abt-hero-inner">
            {/* Classification bar — one instance, fits the field-dispatch concept */}
            <div className="abt-dispatch-bar" aria-hidden="true">
              <span>CLASSIFICATION: OPEN SOURCE</span>
              <span className="abt-dispatch-sep" />
              <span>SECTOR: CIVIC SECURITY</span>
              <span className="abt-dispatch-sep" />
              <span>DOC: ABOUT-01</span>
            </div>
            <h1 className="abt-h1">
              The threats are real.<br />
              The budgets aren't.
            </h1>
            <p className="abt-h1-sub">
              CivicSec Lab is what you build in the gap.
            </p>
            <div className="abt-hero-links">
              <Link className="ofx-btn" to="/login">Enter the system →</Link>
              <a
                className="abt-ghost"
                href="https://github.com/abdullahbtariq/civicsec-lab"
                target="_blank"
                rel="noreferrer"
              >
                View source ↗
              </a>
            </div>
          </div>
        </section>

        {/* ── THE SITUATION ─────────────────────────────────────────────────── */}
        <section className="abt-section abt-alt">
          <div className="abt-inner">
            {/* Stat as a field observation, not a hero metric */}
            <div className="abt-situation-stat">
              <div className="abt-sit-num">#1</div>
              <div className="abt-sit-meta">
                <span className="abt-sit-label">threat vector for civil society</span>
                <span className="abt-sit-src">CyberPeace Institute, 2023</span>
              </div>
            </div>
            <h2 className="abt-h2">Small teams. Enterprise threats.</h2>
            <p className="abt-body">
              Large institutions have SOC teams, SIEM tools, threat intelligence
              subscriptions, and incident response playbooks. Small civic
              organisations — community NGOs, human rights groups, research teams,
              student civic technology projects — often have none of these.
            </p>
            <p className="abt-body">
              The risks haven't disappeared. Login credential attacks, known
              vulnerability exposure, poorly handled datasets, and coordinated
              narrative campaigns all affect civic actors disproportionately.
              CivicSec Lab is an exploration of what lightweight, explainable,
              self-hosted security intelligence can look like when designed
              specifically for public-interest teams.
            </p>
            <blockquote className="abt-quote">
              "Online harm leaves a trace. Signal becomes evidence.
              Evidence becomes action."
              <cite className="abt-quote-cite">— CivicSec Lab founding principle</cite>
            </blockquote>
          </div>
        </section>

        {/* ── SIGNAL ARCHITECTURE ──────────────────────────────────────────── */}
        <section className="abt-section">
          <div className="abt-inner">
            <h2 className="abt-h2">How the signals flow.</h2>
            <p className="abt-arch-sub">
              Data enters through each module. Every module emits risk events into a
              shared layer. The Risk Graph connects them. IncidentFlow closes the loop.
            </p>
            <div className="abt-arch-wrap">
              <ArchGraph />
            </div>
            <div className="abt-arch-legend">
              {ORBITAL_MODULES.map((m) => (
                <div key={m.key} className="abt-legend-item">
                  <span
                    className="abt-legend-dot"
                    style={{ background: m.hex }}
                    aria-hidden="true"
                  />
                  <span className="abt-legend-name">{m.name}</span>
                  <span className="abt-legend-sec">{m.sec}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FIELD DOCTRINE ───────────────────────────────────────────────── */}
        <section className="abt-section abt-alt">
          <div className="abt-inner">
            <h2 className="abt-h2">Field doctrine.</h2>
            <div className="abt-doctrine-list">
              {[
                {
                  title: "Defensive only.",
                  body: "No exploit code, no credential harvesting, no offensive automation, and no capabilities for targeting individuals. Every feature protects, detects, or responds.",
                },
                {
                  title: "Explainable outputs.",
                  body: "Every anomaly, risk score, and detection shows its working. Confidence scores, evidence snapshots, and MITRE ATT&CK context are first-class — not afterthoughts.",
                },
                {
                  title: "Proportionate language.",
                  body: "Outputs say \"signals\", \"clusters\", \"patterns\" — not \"threats\" or \"attacks\". The platform surfaces evidence for human review; it never draws conclusions.",
                },
                {
                  title: "Human review required.",
                  body: "All outputs are decision-support signals. The platform assists analysts; it does not replace them. Every result requires human judgment before any action is taken.",
                },
              ].map((rule) => (
                <div key={rule.title} className="abt-doctrine-rule">
                  <h3 className="abt-doctrine-title">{rule.title}</h3>
                  <p className="abt-doctrine-body">{rule.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEPLOYMENT LOG ───────────────────────────────────────────────── */}
        <section className="abt-section">
          <div className="abt-inner">
            <h2 className="abt-h2">Deployment log.</h2>
            <p className="abt-arch-sub">
              Eight phases. End-to-end engineering: data pipelines, REST API design,
              NLP, anomaly detection, graph theory, and interactive 3D visualisation.
            </p>
            <div className="abt-deploy-list">
              {[
                {
                  phase: "PHASE 0–1",
                  title: "Platform shell",
                  body: "Django 5.2 monorepo, custom user model with org scoping, role-based permissions, Docker Compose, React 18 + TypeScript.",
                },
                {
                  phase: "PHASE 2",
                  title: "ThreatBoard",
                  body: "KEV-style CVE ingestion, EPSS score enrichment with decay, asset matching, explainable composite risk scoring.",
                },
                {
                  phase: "PHASE 3",
                  title: "LogLens",
                  body: "Synthetic log ingestion, six rule-based anomaly detectors, confidence scoring, MITRE ATT&CK-style tactic mapping.",
                },
                {
                  phase: "PHASE 4",
                  title: "DataPrivacy Doctor",
                  body: "CSV upload, type inference, PII + quasi-identifier detection across 14 categories, five-factor composite risk scoring.",
                },
                {
                  phase: "PHASE 5",
                  title: "Observatory",
                  body: "TF-IDF + MiniBatchKMeans clustering, keyword burst detection, spaCy NER, multilingual auto-translation.",
                },
                {
                  phase: "PHASE 6",
                  title: "Civic Risk Graph",
                  body: "Cross-module graph builder, React Flow with custom node types, click-to-inspect panels, minimap + zoom controls.",
                },
                {
                  phase: "PHASE 7",
                  title: "IncidentFlow",
                  body: "Full incident lifecycle: alert → triage → response → closure. Templated playbooks and a full audit timeline.",
                },
                {
                  phase: "PHASE 8",
                  title: "WebGL landing",
                  body: "Three.js orbital flight — a cinematic marketing instrument with six gyroscope ring-nodes and a scroll-driven mission narrative.",
                },
              ].map((p) => (
                <div key={p.phase} className="abt-deploy-entry">
                  <div className="abt-deploy-hd">
                    <div className="abt-deploy-phase">{p.phase}</div>
                    <div className="abt-deploy-status">COMPLETE</div>
                  </div>
                  <div className="abt-deploy-content">
                    <h3 className="abt-deploy-title">{p.title}</h3>
                    <p className="abt-deploy-body">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SIGNAL ORIGIN ────────────────────────────────────────────────── */}
        <section className="abt-section abt-alt">
          <div className="abt-inner">
            <div className="abt-builder-grid">
              <div className="abt-builder-left">
                <h2 className="abt-h2">Abdullah Tariq</h2>
                <p className="abt-lead">
                  I built CivicSec Lab because small civic organisations face the
                  same attackers as banks — without the budget to see them coming.
                </p>
                <p className="abt-body">
                  The platform is the proof: eight phases of engineering, one
                  coherent system. From database schema to WebGL instrument.
                </p>
                <div className="abt-builder-links">
                  <a
                    href="https://www.abdullahbtariq.com"
                    target="_blank"
                    rel="noreferrer"
                    className="abt-extlink"
                  >
                    Portfolio ↗
                  </a>
                  <a
                    href="https://github.com/abdullahbtariq/civicsec-lab"
                    target="_blank"
                    rel="noreferrer"
                    className="abt-extlink"
                  >
                    GitHub ↗
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="abt-extlink"
                  >
                    LinkedIn ↗
                  </a>
                </div>
              </div>
              <div className="abt-builder-right">
                <div className="abt-terminal" role="region" aria-label="Skills log">
                  <div className="abt-terminal-bar" aria-hidden="true">
                    <span className="abt-tb-dot" style={{ background: "#ff5f57" }} />
                    <span className="abt-tb-dot" style={{ background: "#ffbd2e" }} />
                    <span className="abt-tb-dot" style={{ background: "#28c841" }} />
                    <span className="abt-tb-title">skills.log</span>
                  </div>
                  <div className="abt-terminal-body">
                    {([
                      ["backend",  "Django 5.2 · DRF · PostgreSQL · Celery · Redis"],
                      ["frontend", "React 18 · TypeScript · Vite · Tailwind · R3F"],
                      ["3d / viz", "Three.js · @react-three/fiber · React Flow"],
                      ["nlp / ml", "pandas · scikit-learn · spaCy · VADER · NLTK"],
                      ["security", "CISA KEV · EPSS · MITRE ATT&CK · OWASP"],
                      ["infra",    "Docker Compose · GitHub Actions · pytest · Ruff"],
                      ["design",   "WebGL instruments · orbital systems · HUD UX"],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="abt-term-row">
                        <span className="abt-term-key">{k}</span>
                        <span className="abt-term-sep"> › </span>
                        <span className="abt-term-val">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="abt-section abt-cta">
          <div className="abt-cta-inner">
            <div className="abt-status-tag">STATUS: ONLINE</div>
            <h2 className="abt-h2">The system is live.</h2>
            <p className="abt-body">
              Clone the repository, start Docker, and have a fully seeded demo
              running in under five minutes.
            </p>
            <div className="abt-cta-links">
              <Link className="ofx-btn" to="/login">Enter the demo →</Link>
              <a
                className="abt-ghost"
                href="https://github.com/abdullahbtariq/civicsec-lab"
                target="_blank"
                rel="noreferrer"
              >
                View the source ↗
              </a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
