import { motion, useInView, useMotionValueEvent, useScroll, type Variants } from "framer-motion";
import { ArrowRight, CheckCircle2, GitMerge, Search, Upload } from "lucide-react";
import Lenis from "lenis";
import { type CSSProperties, lazy, type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  IncidentFlowIcon,
  LogLensIcon,
  ObservatoryIcon,
  PrivacyDoctorIcon,
  RiskGraphIcon,
  ThreatBoardIcon,
} from "../../components/brand/icons/ModuleIcons";

import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

const WebGLHero = lazy(() =>
  import("./WebGLHero").then((m) => ({ default: m.WebGLHero })),
);

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  white:     "#ffffff",
  grey:      "#f5f5f3",
  border:    "#e8e8e6",
  text:      "#111111",
  secondary: "#3c3c3a",
  muted:     "#6b6b68",
  faint:     "#d4d4d0",
  teal:      "#d65a29",
  tealBright:"#d65a29",
  amber:     "#d99a3c",
  amberText: "#1a0e00",
  ctaBg:     "#0d0f11",
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Reveal helpers ───────────────────────────────────────────────────────────
function Reveal({ children, className = "", delay = 0 }: {
  children: ReactNode; className?: string; delay?: number;
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

function RevealGroup({ children, className = "" }: {
  children: ReactNode; className?: string;
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

// ─── Data ─────────────────────────────────────────────────────────────────────
// Copy written for two audiences simultaneously:
// — non-technical stakeholders get the "what it means"
// — analysts get the technical precision they expect
const MODULES = [
  {
    key:  "threatboard",
    name: "ThreatBoard",
    Icon: ThreatBoardIcon,
    color: "#b8801f",
    href:  "/modules/threatboard",
    description: "Identifies which vulnerabilities in your systems are being actively exploited — and surfaces exactly where to act first.",
  },
  {
    key:  "loglens",
    name: "LogLens",
    Icon: LogLensIcon,
    color: "#54707d",
    href:  "/modules/loglens",
    description: "Detects unusual account and access patterns before they escalate. Mapped to MITRE ATT&CK techniques for analyst context.",
  },
  {
    key:  "privacy-doctor",
    name: "DataPrivacy Doctor",
    Icon: PrivacyDoctorIcon,
    color: "#2a5aa8",
    href:  "/modules/privacy-doctor",
    description: "Scans your datasets for hidden personal data, scores your privacy exposure, and flags what needs remediation.",
  },
  {
    key:  "observatory",
    name: "Misinformation Observatory",
    Icon: ObservatoryIcon,
    color: "#c24a0c",
    href:  "/modules/misinformation-observatory",
    description: "Detects coordinated narratives and information campaigns in public datasets targeting your organisation or sector.",
  },
  {
    key:  "risk-graph",
    name: "Civic Risk Graph",
    Icon: RiskGraphIcon,
    color: "#3d7048",
    href:  "/modules/risk-graph",
    description: "Connects every alert across all modules into one unified risk picture — so related threats surface together, not in isolation.",
  },
  {
    key:  "incidentflow",
    name: "IncidentFlow",
    Icon: IncidentFlowIcon,
    color: "#b23a2c",
    href:  "/modules/incidentflow",
    description: "Manages security incidents end-to-end — from initial alert through investigation, evidence capture, and formal closure.",
  },
];

const STEPS = [
  {
    number: "01", Icon: Upload,
    title: "Ingest",
    description: "Feed the platform with your data — upload log files, scan datasets, or connect live sources. No specialist infrastructure required.",
  },
  {
    number: "02", Icon: Search,
    title: "Analyse",
    description: "Each module independently identifies threats, anomalies, and risks within its domain using purpose-built detection models.",
  },
  {
    number: "03", Icon: GitMerge,
    title: "Correlate",
    description: "The Risk Graph joins signals across modules — so a suspicious login alongside an unpatched CVE surfaces as a connected risk, not two separate alerts.",
  },
  {
    number: "04", Icon: CheckCircle2,
    title: "Respond",
    description: "Investigate findings, assign actions, collect evidence, and close every risk with a full audit trail your team can stand behind.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LandingPage() {
  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    let rafId: number;
    function raf(time: number) { lenis.raf(time); rafId = requestAnimationFrame(raf); }
    rafId = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); };
  }, []);

  // ── Nav visibility — hidden during WebGL story, appears after ────────────
  // The story section is 200vh. The sticky phase ends at 1×vh; the section
  // exits fully at 2×vh. We reveal the nav partway through the exit (130vh)
  // so it's already in place when the platform content fills the screen.
  const [pastStory, setPastStory] = useState(false);
  useEffect(() => {
    const check = () => setPastStory(window.scrollY > window.innerHeight * 2.5);
    check(); // handle page-refresh mid-scroll
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // ── Scroll-driven story ─────────────────────────────────────────────────────
  const sectionRef  = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Feed scroll progress into the WebGL scene each R3F frame
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => { progressRef.current = v; });
    return unsub;
  }, [scrollYProgress]);

  // Chapter visibility — section is 340vh / sticky 100vh, so the inner pins for
  // progress 0 → ~0.70. We derive ONE active chapter from scroll (deterministic;
  // avoids the per-MotionValue desync that let two headlines overlap) and
  // cross-fade with CSS, so exactly one chapter is visible at rest.
  const [activeChapter, setActiveChapter] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = v < 0.30 ? 0 : v < 0.58 ? 1 : 2;
    setActiveChapter((prev) => (prev === next ? prev : next));
  });
  const chapterStyle = (i: number): CSSProperties => ({
    opacity: activeChapter === i ? 1 : 0,
    transform: `translateY(${activeChapter === i ? 0 : 16}px)`,
    transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
    pointerEvents: activeChapter === i ? "auto" : "none",
  });

  return (
    <div style={{ backgroundColor: C.white, color: C.text }}>
      {/* Nav hidden during story; slides in after */}
      <LandingNav visible={pastStory} />

      {/* ── STORY — 340 vh container; inner div is sticky 100 vh ─────────── */}
      <motion.div
        ref={sectionRef}
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        style={{ position: "relative", height: "340vh" }}
        transition={{ duration: 1.0, ease: EASE }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            backgroundColor: "#0c1622",
          }}
        >
          {/* WebGL particle network fills the full viewport */}
          <Suspense fallback={null}>
            <WebGLHero progressRef={progressRef} />
          </Suspense>

          {/* ── Vignettes ──────────────────────────────────────────────────── */}
          {/* Edge darkening — keeps particles from feeling flat */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(12,22,34,0.55) 100%)",
            }}
          />
          {/* Top — nav clearance */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32"
            style={{ background: "linear-gradient(to bottom, rgba(12,22,34,0.65), transparent)" }}
          />
          {/* Bottom — text legibility zone */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-52"
            style={{ background: "linear-gradient(to top, rgba(12,22,34,0.80), transparent)" }}
          />

          {/* ── Chapter 1: Hero ──────────────────────────────────────────── */}
          <motion.div
            className="absolute inset-0 z-10 flex flex-col justify-center px-8 lg:px-16"
            style={chapterStyle(0)}
          >
            <div className="mx-auto w-full max-w-5xl">
              <p
                className="mb-5 text-xs font-semibold uppercase tracking-[0.32em]"
                style={{ color: C.tealBright }}
              >
                Public-interest security intelligence
              </p>
              <h1
                className="font-display font-bold leading-[1.0] tracking-tight"
                style={{ color: "#f0f2f5", fontSize: "clamp(2.8rem, 6.8vw, 5.8rem)" }}
              >
                Security intelligence<br />for civic<br />organisations.
              </h1>
              <p
                className="mt-6 text-base leading-relaxed"
                style={{ color: "rgba(240,242,245,0.48)", maxWidth: "44ch" }}
              >
                Vulnerability exposure, unusual account activity, privacy risks,
                information campaigns — detected, connected, and actionable.
                One open-source platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex min-h-11 items-center gap-2.5 rounded-lg px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: C.amber, color: C.amberText }}
                  to="/login"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-medium transition-colors"
                  href="https://github.com"
                  rel="noreferrer"
                  style={{ color: "rgba(240,242,245,0.36)" }}
                  target="_blank"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(240,242,245,0.80)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(240,242,245,0.36)"; }}
                >
                  View on GitHub
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-1">
                {["Open source", "Apache 2.0", "Self-hosted", "No vendor lock-in"].map((tag) => (
                  <span key={tag} className="text-xs" style={{ color: "rgba(240,242,245,0.20)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Chapter 2: Challenge ──────────────────────────────────────── */}
          <motion.div
            className="absolute inset-0 z-10 flex flex-col justify-center px-8 lg:px-16"
            style={chapterStyle(1)}
          >
            <div className="mx-auto w-full max-w-5xl">
              <p
                className="mb-5 text-xs font-semibold uppercase tracking-[0.32em]"
                style={{ color: C.tealBright }}
              >
                The challenge
              </p>
              <h2
                className="font-display font-bold leading-[1.0] tracking-tight"
                style={{ color: "#f0f2f5", fontSize: "clamp(2.8rem, 6.8vw, 5.8rem)" }}
              >
                Small teams.<br />Enterprise-scale<br />threats.
              </h2>
              <p
                className="mt-6 text-base leading-relaxed"
                style={{ color: "rgba(240,242,245,0.48)", maxWidth: "48ch" }}
              >
                Civic organisations face the same adversaries as large institutions —
                without the staff, tools, or budgets to match.
              </p>
              <div className="mt-10 flex flex-wrap gap-14">
                {[
                  { stat: "60%",      label: "of NGOs operate with no dedicated security staff" },
                  { stat: "1 in 3",   label: "civic datasets contain undetected personal data" },
                  { stat: "197 days", label: "average time to detect a breach without tooling" },
                ].map((item) => (
                  <div key={item.stat}>
                    <p
                      className="font-display font-bold leading-none"
                      style={{ color: C.amber, fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}
                    >
                      {item.stat}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(240,242,245,0.34)" }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Chapter 3: Platform ───────────────────────────────────────── */}
          <motion.div
            className="absolute inset-0 z-10 flex flex-col justify-center px-8 lg:px-16"
            style={chapterStyle(2)}
          >
            <div className="mx-auto w-full max-w-5xl">
              <p
                className="mb-5 text-xs font-semibold uppercase tracking-[0.32em]"
                style={{ color: C.tealBright }}
              >
                The platform
              </p>
              <h2
                className="font-display font-bold leading-[1.0] tracking-tight"
                style={{ color: "#f0f2f5", fontSize: "clamp(2.8rem, 6.8vw, 5.8rem)" }}
              >
                Six modules.<br />One risk model.
              </h2>
              <p
                className="mt-6 text-base leading-relaxed"
                style={{ color: "rgba(240,242,245,0.48)", maxWidth: "48ch" }}
              >
                Every module feeds into a shared risk layer. A vulnerable system,
                an unusual login, a coordinated narrative — surfaced together in one
                connected picture.
              </p>
              <a
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                href="#platform"
                style={{ color: C.tealBright }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e2703f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.tealBright; }}
              >
                Explore the platform ↓
              </a>
            </div>
          </motion.div>

          {/* Scroll cue — fades away with chapter 1 */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center"
            style={{ opacity: activeChapter === 0 ? 1 : 0, transition: "opacity 0.4s ease" }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-10 w-px"
                style={{ background: "linear-gradient(to bottom, rgba(214,90,41,0.4), transparent)" }}
              />
              <span className="text-xs" style={{ color: "rgba(214,90,41,0.32)" }}>scroll</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── PLATFORM — white, module list ─────────────────────────────────── */}
      <section
        id="platform"
        style={{ backgroundColor: C.white, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex items-end justify-between gap-8">
            <Reveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]" style={{ color: C.teal }}>
                The platform
              </p>
              <h2
                className="font-display font-bold leading-tight"
                style={{ color: C.text, fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}
              >
                Six modules.<br />One risk model.
              </h2>
            </Reveal>
            <Reveal className="hidden md:block" delay={0.1}>
              <p className="max-w-xs text-sm leading-relaxed" style={{ color: C.muted }}>
                Every module feeds a shared risk event layer. Related threats —
                a vulnerable system, a suspicious login, a narrative cluster —
                surface together, not as disconnected alerts.
              </p>
            </Reveal>
          </div>

          <RevealGroup>
            {MODULES.map((mod, i) => (
              <motion.div
                key={mod.key}
                style={{ borderTop: `1px solid ${C.border}` }}
                variants={fadeUp}
              >
                <Link
                  className="group flex items-center gap-6 py-6 transition-colors"
                  style={{ backgroundColor: "transparent", display: "flex" }}
                  to={mod.href}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.grey; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span className="shrink-0 w-8 font-mono text-xs font-medium" style={{ color: C.faint }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${mod.color}12`, border: `1px solid ${mod.color}28` }}
                  >
                    <mod.Icon className="h-4 w-4" style={{ color: mod.color }} />
                  </div>
                  <p className="shrink-0 w-52 font-display font-semibold text-sm" style={{ color: C.text }}>
                    {mod.name}
                  </p>
                  <p className="flex-1 text-sm leading-relaxed hidden md:block" style={{ color: C.muted }}>
                    {mod.description}
                  </p>
                  <ArrowRight
                    className="ml-auto h-4 w-4 shrink-0 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1"
                    style={{ color: C.teal }}
                  />
                </Link>
              </motion.div>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}` }} />
          </RevealGroup>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: C.grey, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-14">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]" style={{ color: C.teal }}>
              How it works
            </p>
            <h2
              className="font-display font-bold leading-tight"
              style={{ color: C.text, fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}
            >
              Data flows in.<br />Risks surface.<br />Actions follow.
            </h2>
          </Reveal>

          <RevealGroup className="grid gap-0">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                className="flex items-start gap-8 py-8"
                style={{
                  borderTop: `1px solid ${C.border}`,
                  borderBottom: i === STEPS.length - 1 ? `1px solid ${C.border}` : undefined,
                }}
                variants={fadeUp}
              >
                <span
                  className="font-display font-bold leading-none shrink-0 w-16"
                  style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", color: C.faint }}
                >
                  {step.number}
                </span>
                <div className="flex items-start gap-6 flex-1">
                  <div
                    className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}
                  >
                    <step.Icon className="h-5 w-5" style={{ color: C.muted }} />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-lg" style={{ color: C.text }}>
                      {step.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.muted, maxWidth: "42ch" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── TRUST ─────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: C.white, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em]" style={{ color: C.teal }}>
                Built for trust
              </p>
              <h2
                className="font-display font-bold leading-tight"
                style={{ color: C.text, fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}
              >
                Open source.<br />Your infrastructure.
              </h2>
              <p className="mt-5 text-base leading-relaxed" style={{ color: C.muted }}>
                No vendor lock-in. Your data never leaves your environment.
                Apache 2.0 licensed — inspect the code, fork it, self-host it on
                Docker in minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Python 3.12", "Django 5.2", "PostgreSQL", "React 18", "scikit-learn", "Docker", "Apache 2.0"].map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: C.grey, border: `1px solid ${C.border}`, color: C.secondary }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Reveal>

            <RevealGroup className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Defensive only",        body: "No exploit code, no offensive automation. The platform detects and documents — it never acts." },
                { title: "Shows its working",     body: "Every risk score and anomaly flag includes an explanation. No black boxes, no unexplained outputs." },
                { title: "Human review required", body: "All outputs are decision-support signals. The platform surfaces findings — your team makes the calls." },
                { title: "No data lock-in",       body: "Self-hosted on your own infrastructure. Your data stays exactly where you put it." },
              ].map((p) => (
                <motion.div
                  key={p.title}
                  className="rounded-xl p-5"
                  style={{ backgroundColor: C.grey, border: `1px solid ${C.border}` }}
                  variants={fadeUp}
                >
                  <div className="mb-3 h-0.5 w-6 rounded-full" style={{ backgroundColor: C.teal }} />
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{p.title}</p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: C.muted }}>{p.body}</p>
                </motion.div>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: C.ctaBg, paddingTop: "7rem", paddingBottom: "9rem" }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2
              className="font-display font-bold leading-[1.0] tracking-tight"
              style={{ color: "#f0f2f5", fontSize: "clamp(3rem, 7vw, 6rem)", maxWidth: "14ch" }}
            >
              Try it.<br />It&apos;s open<br />source.
            </h2>
            <p className="mt-6 text-base leading-relaxed" style={{ color: "#5a5a5a", maxWidth: "44ch" }}>
              Clone the repo, start Docker, and run{" "}
              <code
                className="rounded px-1.5 py-0.5 font-mono text-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", color: C.amber }}
              >
                seed_demo
              </code>
              . A fully seeded platform with real-looking data across all six modules — in under five minutes.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex min-h-12 items-center gap-2.5 rounded-lg px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.amber, color: C.amberText }}
                to="/login"
              >
                Sign In to the Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
                href="https://github.com"
                rel="noreferrer"
                style={{ borderColor: "rgba(255,255,255,0.11)", color: "#555555" }}
                target="_blank"
              >
                View on GitHub
              </a>
              <Link
                className="inline-flex min-h-12 items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.22)" }}
                to="/about"
              >
                About the project →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
