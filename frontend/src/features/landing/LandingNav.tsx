import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { BrandMark } from "../../components/brand/BrandMark";

const C = {
  white:    "#ffffff",
  border:   "#e8e8e6",
  text:     "#111111",
  muted:    "#6b6b68",
  teal:     "#0a8e6e",
  amber:    "#d99a3c",
  amberText:"#1a0e00",
} as const;

// `visible` lets the landing page hide the nav entirely during the WebGL story.
// Other pages (About, etc.) omit the prop — it defaults to true and the nav
// always shows as a normal scrolled header.
export function LandingNav({ visible = true }: { visible?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -10 }}
      className="fixed inset-x-0 top-0 z-50"
      initial={{ opacity: 0, y: -10 }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="transition-all duration-300"
        style={
          scrolled
            ? {
                backgroundColor: "rgba(255,255,255,0.96)",
                borderBottom: `1px solid ${C.border}`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }
            : { backgroundColor: "transparent" }
        }
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link className="flex items-center gap-2.5" to="/">
            <BrandMark size={30} boxed className="rounded-lg" />
            <span className="font-display font-semibold text-sm" style={{ color: C.text }}>
              CivicSec Lab
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            {[
              { label: "About",  to: "/about",                                                                  internal: true  },
              { label: "Docs",   to: "https://github.com/abdullahbtariq/civicsec-lab/tree/main/docs",  internal: false },
              { label: "GitHub", to: "https://github.com/abdullahbtariq/civicsec-lab",                 internal: false },
            ].map((item) =>
              item.internal ? (
                <Link
                  key={item.label}
                  className="text-sm transition-colors"
                  style={{ color: C.muted }}
                  to={item.to}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  className="text-sm transition-colors"
                  href={item.to}
                  rel="noreferrer"
                  style={{ color: C.muted }}
                  target="_blank"
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
                >
                  {item.label}
                </a>
              ),
            )}
            <Link
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.amber, color: C.amberText }}
              to="/login"
            >
              Sign In
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="transition-colors md:hidden"
            style={{ color: C.muted }}
            onClick={() => setMenuOpen((v) => !v)}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            style={{
              backgroundColor: C.white,
              borderBottom: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              <Link
                className="py-2 text-sm"
                style={{ color: C.muted }}
                to="/about"
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
              <a
                className="py-2 text-sm"
                href="https://github.com/abdullahbtariq/civicsec-lab/tree/main/docs"
                rel="noreferrer"
                style={{ color: C.muted }}
                target="_blank"
              >
                Docs
              </a>
              <a
                className="py-2 text-sm"
                href="https://github.com/abdullahbtariq/civicsec-lab"
                rel="noreferrer"
                style={{ color: C.muted }}
                target="_blank"
              >
                GitHub
              </a>
              <Link
                className="mt-3 inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: C.amber, color: C.amberText }}
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
