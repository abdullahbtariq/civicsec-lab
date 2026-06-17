import { motion, useInView, type Variants } from "framer-motion";
import {
  ArrowRight,
  Database,
  Eye,
  GitBranch,
  Globe,
  Lock,
  Server,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import Lenis from "lenis";
import { type ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

const C = {
  white: "#ffffff",
  grey: "#f5f5f3",
  border: "#e8e8e6",
  text: "#111111",
  secondary: "#3c3c3a",
  muted: "#6b6b68",
  faint: "#d4d4d0",
  teal: "#0a8e6e",
  tealBright: "#d65a29",
  amber: "#d99a3c",
  amberText: "#1a0e00",
  positive: "#1d7a64",
  info: "#2060a0",
  warning: "#8c6010",
  error: "#8a2838",
  dark: "#111111",
  darkBorder: "#2a2a2a",
  darkMuted: "#888888",
  ctaBg: "#0d0f11",
} as const;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      animate={inView ? "visible" : "hidden"}
      className={className}
      initial="hidden"
      transition={{ delay }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}

function RevealGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      animate={inView ? "visible" : "hidden"}
      className={className}
      initial="hidden"
      variants={stagger}
    >
      {children}
    </motion.div>
  );
}

export function AboutPage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div style={{ backgroundColor: C.white, color: C.text }}>
      <LandingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: C.white,
          paddingTop: "9rem",
          paddingBottom: "6rem",
        }}
      >
        <div className="mx-auto max-w-5xl px-6">
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-xs font-semibold uppercase tracking-[0.35em]"
            initial={{ opacity: 0, y: -10 }}
            style={{ color: C.teal }}
            transition={{ duration: 0.5 }}
          >
            About
          </motion.p>

          <motion.h1
            animate="visible"
            className="font-display font-bold leading-[1.0] tracking-tight"
            initial="hidden"
            style={{
              color: C.text,
              fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
            }}
            variants={stagger}
          >
            {["A civic technology platform", "for security intelligence."].map((line, i) => (
              <motion.span key={i} className="block" variants={fadeUp}>
                {i === 1 ? (
                  <span style={{ color: C.muted }}>{line}</span>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-lg leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            style={{ color: C.muted, maxWidth: "60ch" }}
            transition={{ delay: 0.5, duration: 0.65 }}
          >
            CivicSec Lab was built to close the resource gap between small civic
            organisations and the cyber, data, and platform risks they face every day.
            It is a portfolio project in civic technology, security engineering, and
            responsible AI design.
          </motion.p>
        </div>
      </section>

      {/* ── WHY IT EXISTS — dark section ──────────────────────────────────── */}
      <section style={{ backgroundColor: C.dark, paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <Reveal>
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]"
                style={{ color: C.tealBright }}
              >
                Why It Exists
              </p>
              <h2
                className="font-display font-bold leading-tight"
                style={{
                  color: "#f5f5f5",
                  fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                }}
              >
                The civic security<br />gap is real.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div
                className="space-y-6 text-base leading-relaxed"
                style={{ color: C.darkMuted }}
              >
                <p>
                  Large institutions have SOC teams, SIEM tools, threat intelligence
                  subscriptions, and incident response playbooks. Small civic
                  organisations — community NGOs, human rights groups, research teams,
                  student civic technology projects — often have none of these.
                </p>
                <p>
                  The risks haven&apos;t disappeared. Login credential attacks, known
                  vulnerability exposure, poorly handled datasets, and coordinated
                  narrative campaigns all affect civic actors disproportionately.
                </p>
                <p>
                  CivicSec Lab is an exploration of what lightweight, explainable,
                  self-hosted security intelligence can look like when designed
                  specifically for public-interest teams.
                </p>
                <p
                  className="pl-5 italic"
                  style={{
                    borderLeft: `1px solid ${C.tealBright}50`,
                    color: "#aaaaaa",
                  }}
                >
                  &ldquo;Online harm leaves a trace. Signal becomes evidence. Evidence
                  becomes action.&rdquo;
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── DESIGN PRINCIPLES — white ─────────────────────────────────────── */}
      <section style={{ backgroundColor: C.white, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]"
              style={{ color: C.teal }}
            >
              Design Principles
            </p>
            <h2
              className="font-display font-bold leading-tight"
              style={{
                color: C.text,
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                maxWidth: "36rem",
              }}
            >
              Four commitments baked in from day one.
            </h2>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
            {[
              {
                Icon: Shield,
                iconColor: C.positive,
                title: "Defensive only",
                body: "No exploit code, no credential harvesting, no offensive automation, and no capabilities for targeting individuals. Every feature protects, detects, or responds.",
              },
              {
                Icon: Eye,
                iconColor: C.info,
                title: "Explainable outputs",
                body: "Every anomaly, risk score, and detection shows its working. Confidence scores, evidence snapshots, and MITRE context are first-class — not afterthoughts.",
              },
              {
                Icon: Users,
                iconColor: C.warning,
                title: "Proportionate language",
                body: 'Outputs say "signals", "clusters", "patterns" — not "threats" or "attacks". The platform surfaces evidence for human review; it never draws conclusions.',
              },
              {
                Icon: Lock,
                iconColor: C.error,
                title: "Human review required",
                body: "All outputs are decision-support signals. The platform assists analysts; it does not replace them. Every result requires human judgment.",
              },
            ].map((p) => (
              <motion.div
                key={p.title}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: C.grey,
                  border: `1px solid ${C.border}`,
                }}
                variants={fadeUp}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${p.iconColor}12`,
                    border: `1px solid ${p.iconColor}28`,
                  }}
                >
                  <p.Icon className="h-5 w-5" style={{ color: p.iconColor }} />
                </div>
                <h3 className="font-display font-semibold text-sm" style={{ color: C.text }}>
                  {p.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: C.muted }}>
                  {p.body}
                </p>
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── ARCHITECTURE — grey with dark diagram ─────────────────────────── */}
      <section style={{ backgroundColor: C.grey, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]"
              style={{ color: C.teal }}
            >
              Architecture
            </p>
            <h2
              className="font-display font-bold leading-tight"
              style={{
                color: C.text,
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                maxWidth: "36rem",
              }}
            >
              One shared risk model.<br />Six analysis modules.
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: C.muted, maxWidth: "52ch" }}
            >
              Data enters through each module. Every module emits risk events into a
              shared layer. The Risk Graph connects them. IncidentFlow closes the loop.
            </p>
          </Reveal>

          <Reveal className="mt-12" delay={0.1}>
            <div
              className="overflow-x-auto rounded-2xl p-8"
              style={{
                backgroundColor: "#0d1117",
                border: `1px solid ${C.border}`,
              }}
            >
              <div className="min-w-[640px]">
                {/* Row 1: Data sources */}
                <div className="flex justify-center gap-3">
                  {[
                    { label: "Login Logs", Icon: Server },
                    { label: "CVE / KEV Feed", Icon: Globe },
                    { label: "CSV Datasets", Icon: Database },
                    { label: "Public Posts", Icon: GitBranch },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-1.5 rounded-lg px-4 py-3"
                      style={{ backgroundColor: "#0f2230", border: "1px solid #1e2329" }}
                    >
                      <s.Icon className="h-4 w-4" style={{ color: "#a7b0bb" }} />
                      <span className="text-xs" style={{ color: "#a7b0bb" }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="my-4 flex justify-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="h-5 w-px" style={{ backgroundColor: "#1e2329" }} />
                    <div className="h-0 w-0" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #1e2329" }} />
                  </div>
                </div>

                {/* Row 2: Modules */}
                <div className="flex justify-center gap-3">
                  {[
                    { label: "ThreatBoard", color: "#c4821a" },
                    { label: "LogLens", color: "#a855f7" },
                    { label: "Privacy Doctor", color: "#71a7ff" },
                    { label: "Observatory", color: "#d99a3c" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-lg px-4 py-3"
                      style={{ border: `1px solid ${m.color}33`, backgroundColor: `${m.color}0d` }}
                    >
                      <span className="text-xs font-medium" style={{ color: m.color }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="my-4 flex justify-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="h-5 w-px" style={{ backgroundColor: "#1e2329" }} />
                    <div className="h-0 w-0" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #1e2329" }} />
                  </div>
                </div>

                {/* Shared risk layer */}
                <div className="flex justify-center">
                  <div
                    className="rounded-lg px-8 py-4 text-center"
                    style={{ border: "1px solid rgba(67,217,173,0.30)", backgroundColor: "rgba(67,217,173,0.07)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#d65a29" }}>
                      Shared Risk Event Layer
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "#a7b0bb" }}>
                      RiskEvent · EvidenceItem · ActionRecommendation
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="my-4 flex justify-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="h-5 w-px" style={{ backgroundColor: "#1e2329" }} />
                    <div className="h-0 w-0" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #1e2329" }} />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex justify-center gap-3">
                  <div className="rounded-lg px-6 py-3 text-center" style={{ border: "1px solid rgba(67,217,173,0.33)", backgroundColor: "rgba(67,217,173,0.09)" }}>
                    <p className="text-xs font-semibold" style={{ color: "#d65a29" }}>Risk Graph</p>
                    <p className="mt-0.5 text-xs" style={{ color: "#a7b0bb" }}>Connected intelligence</p>
                  </div>
                  <div className="rounded-lg px-6 py-3 text-center" style={{ border: "1px solid rgba(238,108,122,0.33)", backgroundColor: "rgba(238,108,122,0.09)" }}>
                    <p className="text-xs font-semibold" style={{ color: "#ee6c7a" }}>IncidentFlow</p>
                    <p className="mt-0.5 text-xs" style={{ color: "#a7b0bb" }}>Response workflow</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── RESPONSIBLE USE — white ───────────────────────────────────────── */}
      <section style={{ backgroundColor: C.white, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <Reveal>
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]"
                style={{ color: C.teal }}
              >
                Responsible Use
              </p>
              <h2
                className="font-display font-bold leading-tight"
                style={{ color: C.text, fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
              >
                What this platform does — and does not do.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "✓ Does",
                    accentColor: C.positive,
                    items: [
                      "Surfaces known vulnerability exposure",
                      "Detects suspicious login patterns",
                      "Profiles datasets for privacy risk",
                      "Monitors public narrative signals",
                      "Provides explainable risk scores",
                      "Supports structured incident response",
                    ],
                  },
                  {
                    label: "✕ Does not",
                    accentColor: C.error,
                    items: [
                      "Provide exploit code or PoCs",
                      "Harvest or store credentials",
                      "Automate offensive actions",
                      "Label content as disinformation",
                      "Target or profile individuals",
                      "Draw conclusions without evidence",
                    ],
                  },
                ].map((col) => (
                  <div
                    key={col.label}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: C.grey, border: `1px solid ${C.border}` }}
                  >
                    <p
                      className="mb-4 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: col.accentColor }}
                    >
                      {col.label}
                    </p>
                    <ul className="space-y-2">
                      {col.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm"
                          style={{ color: C.muted }}
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: col.accentColor }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL DEPTH — grey ────────────────────────────────────────── */}
      <section style={{ backgroundColor: C.grey, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]"
              style={{ color: C.teal }}
            >
              Technical Depth
            </p>
            <h2
              className="font-display font-bold leading-tight"
              style={{ color: C.text, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", maxWidth: "36rem" }}
            >
              Full-stack from database to WebGL.
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: C.muted, maxWidth: "52ch" }}
            >
              Eight phases, end-to-end engineering: data pipelines, REST API design,
              NLP, anomaly detection, graph theory, and interactive 3D visualisation.
            </p>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { phase: "Phase 0–1", title: "Platform shell", body: "Django 5.2 monorepo, custom user model with org scoping, role-based permissions, Docker Compose, React 18 + TypeScript." },
              { phase: "Phase 2", title: "ThreatBoard", body: "KEV-style CVE ingestion, EPSS score enrichment with decay, asset matching, explainable composite risk scoring." },
              { phase: "Phase 3", title: "LogLens", body: "Synthetic log ingestion, six rule-based anomaly detectors, confidence scoring, MITRE ATT&CK-style tactic mapping." },
              { phase: "Phase 4", title: "DataPrivacy Doctor", body: "CSV upload, type inference, PII + quasi-identifier detection across 14 categories, five-factor composite risk scoring." },
              { phase: "Phase 5–6", title: "Observatory + IncidentFlow", body: "TF-IDF + MiniBatchKMeans clustering, keyword burst detection, spaCy NER. Incident management with timeline and playbooks." },
              { phase: "Phase 7", title: "Civic Risk Graph", body: "Cross-module graph builder, React Flow with custom node types, click-to-inspect panels, minimap + zoom controls." },
            ].map((item) => (
              <motion.div
                key={item.phase}
                className="rounded-xl p-5"
                style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}
                variants={fadeUp}
              >
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: `${C.teal}` }}
                >
                  {item.phase}
                </p>
                <h3 className="font-display font-semibold text-sm" style={{ color: C.text }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── BUILDER — white ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor: C.white, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <Reveal>
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]"
                style={{ color: C.teal }}
              >
                The Builder
              </p>
              <h2
                className="font-display font-bold leading-tight"
                style={{ color: C.text, fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
              >
                Abdullah Tariq
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: C.muted }}>
                Full-stack engineer and civic technologist. CivicSec Lab demonstrates
                competency across backend engineering, data pipeline design, NLP and ML
                integration, security tooling, and interactive frontend development.
              </p>
              <p className="mt-4 text-base leading-relaxed" style={{ color: C.muted }}>
                The project is a portfolio artefact intended to show how a complete,
                production-grade platform is designed, built, and documented — from
                database schema to WebGL visualisation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { label: "Portfolio", href: "https://www.abdullahbtariq.com", Icon: ShieldCheck },
                  { label: "GitHub", href: "https://github.com", Icon: null },
                  { label: "LinkedIn", href: "https://linkedin.com", Icon: null },
                ].map((link) => (
                  <a
                    key={link.label}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
                    href={link.href}
                    rel="noreferrer"
                    style={{ border: `1px solid ${C.border}`, color: C.muted }}
                    target="_blank"
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
                  >
                    {link.Icon && <link.Icon className="h-4 w-4" style={{ color: C.teal }} />}
                    {link.label}
                  </a>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div
                className="rounded-xl p-8"
                style={{ backgroundColor: C.grey, border: `1px solid ${C.border}` }}
              >
                <p
                  className="mb-6 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: C.muted }}
                >
                  Skills demonstrated in this project
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Django 5.2", "Django REST Framework", "PostgreSQL", "Celery",
                    "React 18", "TypeScript", "Vite", "Tailwind CSS", "React Router 7",
                    "Three.js / R3F", "Framer Motion", "pandas", "scikit-learn",
                    "spaCy", "TF-IDF clustering", "k-Means", "Docker Compose",
                    "GitHub Actions", "Ruff", "pytest", "API design", "data modelling",
                    "security tooling", "NLP pipelines", "graph visualisation",
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full px-3 py-1 text-xs"
                      style={{
                        backgroundColor: C.white,
                        border: `1px solid ${C.border}`,
                        color: C.muted,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA — dark ────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: C.ctaBg,
          paddingTop: "6rem",
          paddingBottom: "7rem",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <div
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              <ShieldCheck className="h-6 w-6" style={{ color: "#f5f5f5" }} />
            </div>
            <h2
              className="font-display font-bold tracking-tight"
              style={{ color: "#f5f5f5", fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
            >
              Ready to run the platform?
            </h2>
            <p
              className="mx-auto mt-4 text-base leading-relaxed"
              style={{ color: "#666666", maxWidth: "44ch" }}
            >
              Clone the repository, start Docker, and have a fully seeded demo
              running in under five minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.amber, color: C.amberText }}
                to="/login"
              >
                Sign In to Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ borderColor: "rgba(255,255,255,0.14)", color: "#666666" }}
                to="/"
              >
                Back to Home
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
