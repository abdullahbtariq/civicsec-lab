import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const C = {
  white: "#ffffff",
  border: "#e8e8e6",
  text: "#111111",
  muted: "#6b6b68",
  teal: "#0a8e6e",
} as const;

export function LandingFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.white }}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${C.teal}14`,
                border: `1px solid ${C.teal}28`,
              }}
            >
              <ShieldCheck className="h-4 w-4" style={{ color: C.teal }} />
            </div>
            <div>
              <p className="font-display font-semibold text-sm" style={{ color: C.text }}>
                CivicSec Lab
              </p>
              <p className="text-xs" style={{ color: C.muted }}>
                Public-interest security intelligence
              </p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              { label: "About",           to: "/about",                                                                                  internal: true  },
              { label: "Sign In",         to: "/login",                                                                                  internal: true  },
              { label: "Docs",            to: "https://github.com/abdullahbtariq/civicsec-lab/tree/main/docs",                          internal: false },
              { label: "GitHub",          to: "https://github.com/abdullahbtariq/civicsec-lab",                                         internal: false },
              { label: "Responsible Use", to: "https://github.com/abdullahbtariq/civicsec-lab/blob/main/docs/responsible-use.md",       internal: false },
              { label: "Apache 2.0",      to: "https://www.apache.org/licenses/LICENSE-2.0",                                            internal: false },
            ].map((item) =>
              item.internal ? (
                <Link
                  key={item.label}
                  className="text-xs transition-colors"
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
                  className="text-xs transition-colors"
                  href={item.to}
                  rel="noreferrer"
                  style={{ color: C.muted }}
                  target={item.to.startsWith("http") ? "_blank" : undefined}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-xs" style={{ color: C.muted }}>
            © 2026 CivicSec Lab. Built for defensive, educational, and public-interest
            security use. All sample data is fictional.
          </p>
        </div>
      </div>
    </footer>
  );
}
