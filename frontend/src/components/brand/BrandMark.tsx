import { cn } from "../../lib/utils";

type BrandMarkProps = {
  /** Rendered pixel size (width = height). Default 36. */
  size?: number;
  /** Wrap the mark in the brand navy rounded-square "app icon". */
  boxed?: boolean;
  /** Animate the radar sweep + nodes on mount (respects prefers-reduced-motion via CSS). */
  animated?: boolean;
  className?: string;
  title?: string;
};

/**
 * The CivicSec Lab radar/orbital logo mark.
 *
 * A disc quartered by its center axes: the left half is solid "evidence"
 * (orange ↘, slate ↖), the right half is a radar field of dispersed signal
 * nodes resolving toward the orange origin — "signals to evidence".
 *
 * Brand colors are inlined so the mark renders identically regardless of
 * surrounding CSS. Designed to read on the navy app surface.
 */
export function BrandMark({
  size = 36,
  boxed = false,
  animated = false,
  className,
  title = "CivicSec Lab",
}: BrandMarkProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animated && "brand-mark--animated", className)}
    >
      {title ? <title>{title}</title> : null}
      {boxed ? <rect width="64" height="64" rx="14" fill="#0f2230" /> : null}

      {/* construction axes */}
      <line x1="32" y1="10" x2="32" y2="54" stroke="#f3eadc" strokeOpacity="0.22" strokeWidth="1" />
      <line x1="10" y1="32" x2="54" y2="32" stroke="#f3eadc" strokeOpacity="0.22" strokeWidth="1" />

      {/* left half — solid evidence quadrants */}
      <path d="M32 32 L10 32 A22 22 0 0 0 32 54 Z" fill="#d65a29" />
      <path d="M32 32 L10 32 A22 22 0 0 1 32 10 Z" fill="#2a4a5e" />

      {/* right half — radar field rings */}
      <path d="M32 17 A15 15 0 0 1 32 47" stroke="#f3eadc" strokeOpacity="0.45" strokeWidth="1" fill="none" />
      <path d="M32 24 A8 8 0 0 1 32 40" stroke="#f3eadc" strokeOpacity="0.55" strokeWidth="1" fill="none" />

      {/* radar sweep */}
      <line
        className="brand-mark__sweep"
        x1="32" y1="32" x2="49" y2="18"
        stroke="#f3eadc" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 2"
      />

      {/* dispersed signal nodes */}
      <g className="brand-mark__nodes">
        <circle cx="43" cy="21" r="2" fill="#d65a29" />
        <circle cx="49" cy="30" r="1.6" fill="#f3eadc" />
        <circle cx="45" cy="40" r="1.6" fill="#f3eadc" />
        <circle cx="39" cy="25" r="1.3" fill="#d65a29" />
        <circle cx="47" cy="45" r="1.6" fill="#d65a29" />
        <circle cx="52" cy="36" r="1.3" fill="#f3eadc" />
      </g>

      {/* origin */}
      <circle cx="32" cy="32" r="2.6" fill="#d65a29" />

      {/* disc edge */}
      <circle cx="32" cy="32" r="22" stroke="#f3eadc" strokeOpacity="0.85" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
