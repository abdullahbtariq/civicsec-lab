import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { OrbitalHandle, OrbitalPhase } from "./orbital/orbitalField";
import { ORBITAL_MODULES } from "./orbital/modules";
import { LandingNav } from "./LandingNav";
import "./orbital/orbital.css";

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export function LandingPage() {
  const [webgl] = useState(webglAvailable);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<OrbitalHandle | null>(null);
  const returnRef = useRef<HTMLButtonElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const prevFocused = useRef<number | null>(null);

  const [phase, setPhase] = useState<OrbitalPhase>("hero");
  const [focused, setFocused] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [booted, setBooted] = useState(false);
  const [clock, setClock] = useState("--:--:--Z");

  // Navy body background while on the landing route (app body is cream).
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

  // Lazy-mount the 3D field so the heavy three.js chunk stays out of first paint.
  // It reads scroll every frame and reports phase changes back (single source of truth).
  // The async import + `cancelled` flag also makes StrictMode's double-mount a no-op.
  useEffect(() => {
    if (!webgl) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let handle: OrbitalHandle | null = null;
    let cancelled = false;
    let bootId = 0;
    void import("./orbital/orbitalField").then(({ createOrbitalField }) => {
      if (cancelled || !canvasRef.current || !labelsRef.current) return;
      try {
        handle = createOrbitalField(canvasRef.current, labelsRef.current, {
          reducedMotion: reduce,
          onHover: setHovered,
          onSelect: setFocused,
          onPhase: setPhase,
        });
      } catch {
        return;
      }
      fieldRef.current = handle;
      bootId = window.setTimeout(() => setBooted(true), reduce ? 0 : 1700);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(bootId);
      handle?.dispose();
      fieldRef.current = null;
    };
  }, [webgl]);

  const selectModule = (i: number) => {
    fieldRef.current?.focus(i);
    setFocused(i);
  };
  const step = (d: number) => {
    if (focused == null) return;
    selectModule((focused + d + ORBITAL_MODULES.length) % ORBITAL_MODULES.length);
  };
  const exit = () => {
    fieldRef.current?.exit();
    setFocused(null);
  };

  // Keyboard: Esc closes a module, arrows step between systems.
  useEffect(() => {
    if (focused == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  // Focus management: into the panel on open (after paint), back to the wordmark on close.
  useEffect(() => {
    let raf = 0;
    if (focused != null) raf = requestAnimationFrame(() => returnRef.current?.focus());
    else if (prevFocused.current != null) brandRef.current?.focus();
    prevFocused.current = focused;
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [focused]);

  const beatStyle = (p: OrbitalPhase): CSSProperties => ({
    opacity: phase === p ? 1 : 0,
    pointerEvents: phase === p ? "auto" : "none",
  });

  const m = focused != null ? ORBITAL_MODULES[focused] : null;
  const tintStyle: CSSProperties = m
    ? { background: `radial-gradient(72% 72% at 60% 50%, ${m.hex}2e 0%, transparent 62%)`, opacity: 1 }
    : { opacity: 0 };

  // ---- no-WebGL / unsupported fallback: a static, fully readable page ----
  if (!webgl) {
    return (
      <div className="ofx-root ofx-fallback">
        <header className="ofx-nav" style={{ position: "absolute" }}>
          <span className="ofx-brand"><span className="ofx-g" /><span>CivicSec Lab</span></span>
          <span className="ofx-navlinks">
            <Link to="/about">About</Link>
            <Link className="ofx-cta" to="/login">Sign In</Link>
          </span>
        </header>
        <h1 style={{ fontFamily: '"Source Serif 4",serif', fontSize: "clamp(2.4rem,5vw,4rem)", lineHeight: 1.04, maxWidth: "18ch" }}>
          Six systems. One civic core.
        </h1>
        <p style={{ marginTop: "1.2rem", maxWidth: "60ch", color: "var(--muted)", lineHeight: 1.6 }}>
          An open-source security platform for civic organisations — it watches for exploited
          vulnerabilities, account threats, exposed data, and disinformation, then connects them
          into one risk picture.
        </p>
        <ul style={{ marginTop: "2.5rem", display: "grid", gap: "1rem", maxWidth: "60ch", listStyle: "none", padding: 0 }}>
          {ORBITAL_MODULES.map((mod) => (
            <li key={mod.key}>
              <strong style={{ color: "var(--cream)" }}>{mod.name}</strong>
              <span style={{ color: "var(--muted)" }}> — {mod.what}</span>
            </li>
          ))}
        </ul>
        <Link className="ofx-btn" style={{ display: "inline-block", marginTop: "2.5rem" }} to="/login">
          Enter the demo →
        </Link>
      </div>
    );
  }

  return (
    <div className="ofx-root">
      {/* Skip link: lets keyboard-only users bypass the scroll narrative and reach the systems summary */}
      <a href="#ofx-summary" className="ofx-skip">Skip to systems summary</a>
      <canvas className="ofx-field" ref={canvasRef} aria-hidden="true" />
      <div className="ofx-tint" style={tintStyle} aria-hidden="true" />
      <div className={"ofx-modscrim" + (focused != null ? " ofx-on" : "")} aria-hidden="true" />
      <div className="ofx-vig" aria-hidden="true" />
<div className="ofx-labels" ref={labelsRef} aria-hidden="true" />
      <div className="ofx-spacer" aria-hidden="true" />

      <div className={"ofx-pre" + (booted ? " ofx-done" : "")} aria-hidden="true">
        <div className="ofx-ring" />
        <div className="ofx-t">Igniting Core</div>
        <div className="ofx-x">CIVIC SIGNAL CORE · 6 SYSTEMS · ONLINE</div>
      </div>

      <LandingNav visible={booted} logoRef={brandRef} />

      <div className="ofx-hud" aria-hidden="true">
        <div className="ofx-tick ofx-tl" /><div className="ofx-tick ofx-tr" />
        <div className="ofx-tick ofx-bl" /><div className="ofx-tick ofx-br" />
        <div className="ofx-met">
          SIGNAL CORE // <b>ONLINE</b><br />SYSTEMS 6/6 · LINK <b>STABLE</b><br />MET <b>{clock}</b>
        </div>
        <div className="ofx-sysid">
          ORBITAL FLIGHT<br />SECTOR <b>CIVIC-01</b><br />
          ◦ {m ? m.name.toUpperCase() : "DESCENDING"}
        </div>
      </div>

      <main>
      {/* cinematic beats */}
      <section className="ofx-beat ofx-intro" style={beatStyle("hero")}>
        <div>
          <h1>Six systems.<br />One civic core.</h1>
          <p>
            An open-source security platform for civic organisations — it watches for exploited
            vulnerabilities, account threats, exposed data, and disinformation, then connects them
            into one risk picture.
          </p>
          <div className="ofx-btns">
            <Link className="ofx-btn" to="/login">Enter the demo →</Link>
            <a className="ofx-btn ofx-ghost" href="https://github.com/abdullahbtariq/civicsec-lab" target="_blank" rel="noreferrer">View on GitHub</a>
          </div>
        </div>
      </section>

      <section className="ofx-beat ofx-mid" style={beatStyle("why")}>
        <div>
          <div className="ofx-k">Why it exists</div>
          <h2>Cyber-poor, target-rich.</h2>
          <p>
            Civic organisations face the same attackers as governments and banks — credential theft,
            exploited vulnerabilities, leaked data, coordinated disinformation — without the staff,
            tooling, or budget to defend themselves.
          </p>
          <div className="ofx-cap">“Cyber-poor, target-rich” — CyberPeace Institute</div>
        </div>
      </section>

      <section className="ofx-beat ofx-mid" style={beatStyle("core")}>
        <div>
          <div className="ofx-k">What it does</div>
          <h2>Six systems feed one risk core.</h2>
          <p>
            Each system watches one kind of threat and emits into a shared risk layer — so related
            signals surface together, not as scattered alerts.
          </p>
          <div className="ofx-cap" style={{ color: "var(--orange-lt)" }}>↓ Select any system below to see what it does</div>
        </div>
      </section>

      <section className="ofx-beat ofx-mid" style={beatStyle("who")}>
        <div>
          <div className="ofx-k">Who it's for</div>
          <h2>Teams without a SOC.</h2>
          <div className="ofx-who">
            <span>Community NGOs</span><span>Human-rights &amp; advocacy</span>
            <span>Journalists &amp; researchers</span><span>Student civic-tech</span>
          </div>
        </div>
      </section>

      <section className="ofx-beat ofx-mid" style={beatStyle("cred")}>
        <div>
          <div className="ofx-k">Built to be trusted</div>
          <h2>Open by design.</h2>
          <p>
            Self-hosted on Docker — your data never leaves your environment. Defensive-only: it
            detects and documents, never exploits. Every score is explainable and built for human review.
          </p>
          <div className="ofx-tags">
            <span>Apache-2.0</span><span>Self-hosted</span><span>CISA KEV</span><span>FIRST EPSS</span><span>MITRE ATT&amp;CK</span>
          </div>
          <div className="ofx-cap">A full-stack reference implementation &amp; portfolio project by Abdullah Tariq</div>
        </div>
      </section>

      <section className="ofx-beat ofx-mid" style={beatStyle("outro")}>
        <div>
          <div className="ofx-k">Ready</div>
          <h2>Step inside the system.</h2>
          <div className="ofx-btns">
            <Link className="ofx-btn" to="/login">Enter the demo →</Link>
            <a className="ofx-btn ofx-ghost" href="https://github.com/abdullahbtariq/civicsec-lab" target="_blank" rel="noreferrer">Read the docs</a>
          </div>
        </div>
      </section>

      <div className="ofx-cue" style={{ opacity: phase === "hero" ? 1 : 0 }} aria-hidden="true">
        <span className="ofx-pulse" />Scroll to descend into the system
      </div>

      {/* systems index — the guidance that the nodes are explorable */}
      <nav className={"ofx-index" + (phase === "explore" && focused == null ? " ofx-on" : "")} aria-label="Systems">
        <span className="ofx-lab">Systems —</span>
        {ORBITAL_MODULES.map((mod, i) => (
          <button
            key={mod.key}
            className={"ofx-chip" + (hovered === i ? " ofx-active" : "")}
            onClick={() => selectModule(i)}
            type="button"
          >
            <span className="ofx-d" style={{ background: mod.hex }} />
            {mod.sec.replace("·", "-")} {mod.name.split(" ")[0]}
          </button>
        ))}
      </nav>

      {/* module panel */}
      <div
        className={"ofx-modview" + (focused != null ? " ofx-on" : "")}
        role={m ? "region" : undefined}
        aria-label={m ? `${m.name} — system details` : undefined}
      >
        {m && (
          <>
            <button className="ofx-mret" ref={returnRef} onClick={exit} type="button">← Return to overview</button>
            <div className="ofx-msec">{m.sec} // SYSTEM</div>
            <h3>{m.name}</h3>
            <p className="ofx-mdesc">{m.what}</p>
            <div className="ofx-mstats">
              {m.stats.map((s) => (
                <div key={s.k}>{s.k} : <b>{s.v}</b></div>
              ))}
            </div>
            <div className="ofx-row">
              <Link className="ofx-enter" to={m.href}>Enter full module →</Link>
              <button className="ofx-nb" onClick={() => step(-1)} type="button" aria-label="Previous system">◂</button>
              <button className="ofx-nb" onClick={() => step(1)} type="button" aria-label="Next system">▸</button>
              <span className="ofx-cnt">{focused! + 1} / {ORBITAL_MODULES.length}</span>
            </div>
          </>
        )}
      </div>

      {/* always-in-DOM content for search engines + screen readers; target of skip link */}
      <div id="ofx-summary" className="ofx-sr" role="region" aria-label="Systems overview">
        <p>CivicSec Lab — open-source security intelligence for civic organisations</p>
        <p>
          Six systems around one civic risk core: vulnerability exposure, account threats, data
          privacy, disinformation, correlation, and incident response. Built for civic teams without
          a security operations centre.
        </p>
        <ul>
          {ORBITAL_MODULES.map((mod) => (
            <li key={mod.key}>{mod.name}: {mod.what}</li>
          ))}
        </ul>
      </div>
      </main>
    </div>
  );
}
