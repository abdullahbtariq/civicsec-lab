import { AnimatePresence, motion, type Variants } from "framer-motion";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { BrandMark } from "../../components/brand/BrandMark";
import { cn } from "../../lib/utils";

const NAV_LINKS = [
  { label: "About",  to: "/about",                                                            internal: true  },
  { label: "Docs",   to: "https://github.com/abdullahbtariq/civicsec-lab/tree/main/docs",      internal: false },
  { label: "GitHub", to: "https://github.com/abdullahbtariq/civicsec-lab",                     internal: false },
] as const;

// ── Glass pill formula ──────────────────────────────────────────────────────
const GLASS =
  "rounded-full backdrop-blur-xl bg-civic-surface/[0.55] " +
  "ring-1 ring-white/[0.15] " +
  "shadow-[0_4px_20px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10)] " +
  "transition-colors duration-200";

// Shared style for the three nav-link pills (excludes base GLASS so it composes)
const LINK_PILL = cn(
  GLASS,
  "relative block overflow-hidden px-4 py-[7px]",
  "text-sm text-civic-muted",
  "hover:text-civic-text hover:ring-white/[0.30]",
);

// ── Framer-motion entrance variants ────────────────────────────────────────
const containerV: Variants = {
  hidden:  { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const itemV: Variants = {
  hidden:  { opacity: 0, y: -10, scale: 0.93 },
  visible: { opacity: 1, y: 0,   scale: 1,
             transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

/** `visible` hides the nav during the WebGL preloader (LandingPage).
 *  `logoRef` forwards to the logo anchor for orbital keyboard focus management. */
export function LandingNav({
  visible = true,
  logoRef,
}: {
  visible?: boolean;
  logoRef?: RefObject<HTMLAnchorElement | null>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // When visible=true from mount (About page), skip entrance animation so
  // pills don't get stuck at opacity:0 if the tab is backgrounded on load.
  // When visible starts false (Landing page preloader), use the stagger entrance.
  const [needsEntrance] = useState(() => !visible);

  // ── ReactBits-inspired GSAP circle-fill hover ──────────────────────────
  // Each nav-link pill contains an absolutely-positioned circle span.
  // On hover, GSAP scales it 0 → 1.2 from a transform-origin that places
  // the pivot at the circle's geometric centre. The circle is sized so its
  // chord equals the pill's width and sits flush with the bottom edge, so
  // the fill "rises" upward to cover the pill naturally.
  //
  // NOTE: these refs are keyed by index into NAV_LINKS.  The three spans
  // are always mounted (desktop row never unmounts within the stagger) so
  // the one-time useLayoutEffect setup stays valid.
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs     = useRef<(gsap.core.Timeline | null)[]>([]);
  const tweenRefs  = useRef<({ kill(): void } | null)[]>([]);

  useLayoutEffect(() => {
    const layout = () => {
      NAV_LINKS.forEach((_, i) => {
        const circle = circleRefs.current[i];
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const { width: w, height: h } = pill.getBoundingClientRect();
        if (w === 0 || h === 0) return;

        // Geometry: find the circle whose chord = pill width sits flush with
        // the bottom edge (identical maths to ReactBits PillNav source).
        const R       = ((w * w) / 4 + h * h) / (2 * h);
        const D       = Math.ceil(2 * R) + 2;
        const delta   = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width  = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        tlRefs.current[i]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, {
          scale: 1.2, xPercent: -50, duration: 2,
          ease: "power3.easeOut", overwrite: "auto",
        }, 0);
        tlRefs.current[i] = tl;
      });
    };

    layout();
    window.addEventListener("resize", layout);
    document.fonts?.ready.then(layout).catch(() => {});

    return () => {
      window.removeEventListener("resize", layout);
      tlRefs.current.forEach((tl) => tl?.kill());
    };
  }, []);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    tweenRefs.current[i]?.kill();
    tweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3, ease: "power3.easeOut", overwrite: "auto",
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    tweenRefs.current[i]?.kill();
    tweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2, ease: "power3.easeOut", overwrite: "auto",
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────
  // Outer div is a plain <div> with inline transform so framer-motion's
  // animated y never clobbers the translateX(-50%) centering.
  return (
    <div
      className="fixed left-1/2 top-4 z-50 w-max"
      style={{ transform: "translateX(-50%)" }}
    >
      {/* DESKTOP ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="hidden items-center gap-2 md:flex"
        initial={needsEntrance ? "hidden" : false}
        animate={visible ? "visible" : "hidden"}
        variants={containerV}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        {/* Logo pill */}
        <motion.div variants={itemV}>
          <Link
            ref={logoRef as React.RefObject<HTMLAnchorElement>}
            to="/"
            className={cn(
              GLASS,
              "flex items-center gap-2 px-3 py-[7px] text-civic-text",
              "hover:bg-civic-surface/[0.78] hover:ring-white/[0.30]",
            )}
          >
            <BrandMark boxed className="rounded-[6px]" size={24} />
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
              CivicSec Lab
            </span>
          </Link>
        </motion.div>

        {/* Nav link pills — inlined to avoid inner-component remount
            that would orphan the GSAP timelines from their DOM nodes   */}
        {NAV_LINKS.map((link, i) => (
          <motion.div key={link.label} variants={itemV}>
            {link.internal ? (
              <Link
                to={link.to}
                className={LINK_PILL}
                onMouseEnter={() => handleEnter(i)}
                onMouseLeave={() => handleLeave(i)}
              >
                {/* GSAP circle — rises from below on hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 rounded-full bg-white/[0.14]"
                  ref={(el) => { circleRefs.current[i] = el; }}
                />
                <span className="relative z-10">{link.label}</span>
              </Link>
            ) : (
              <a
                href={link.to}
                target="_blank"
                rel="noreferrer"
                className={LINK_PILL}
                onMouseEnter={() => handleEnter(i)}
                onMouseLeave={() => handleLeave(i)}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 rounded-full bg-white/[0.14]"
                  ref={(el) => { circleRefs.current[i] = el; }}
                />
                <span className="relative z-10">{link.label}</span>
              </a>
            )}
          </motion.div>
        ))}

        {/* Sign In — solid orange, intentional CTA contrast */}
        <motion.div variants={itemV}>
          <Link
            to="/login"
            className="block rounded-full bg-[#d65a29] px-4 py-[7px] text-sm font-semibold text-white shadow-[0_4px_16px_rgba(214,90,41,0.50)] transition-all hover:bg-[#c24a1c] hover:shadow-[0_4px_22px_rgba(214,90,41,0.68)]"
          >
            Sign In
          </Link>
        </motion.div>
      </motion.div>

      {/* MOBILE ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="flex items-center gap-2 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          to="/"
          className={cn(GLASS, "flex items-center gap-2 px-3 py-[7px] text-civic-text")}
        >
          <BrandMark boxed className="rounded-[6px]" size={22} />
          <span className="text-sm font-semibold tracking-tight">CivicSec Lab</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className={cn(
            GLASS,
            "flex h-[38px] w-[38px] items-center justify-center text-civic-muted",
            "hover:bg-civic-surface/[0.78] hover:text-civic-text hover:ring-white/[0.30]",
          )}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </motion.div>

      {/* MOBILE DROPDOWN ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute left-0 mt-2 w-52 overflow-hidden rounded-2xl",
              "backdrop-blur-xl bg-civic-surface/[0.85]",
              "ring-1 ring-white/[0.15]",
              "shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.10)]",
            )}
          >
            <div className="flex flex-col gap-0.5 p-2">
              {NAV_LINKS.map((link) =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-sm text-civic-muted transition-colors hover:bg-white/[0.07] hover:text-civic-text"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.to}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-sm text-civic-muted transition-colors hover:bg-white/[0.07] hover:text-civic-text"
                  >
                    {link.label}
                  </a>
                ),
              )}
              <div className="mt-1.5 border-t border-white/[0.08] pt-1.5">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-[#d65a29] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c24a1c]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
