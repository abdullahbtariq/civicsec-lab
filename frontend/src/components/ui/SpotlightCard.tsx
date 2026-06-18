import { useRef, type HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

/**
 * ReactBits-inspired Spotlight Card.
 *
 * Wraps any card surface with a mouse-tracking radial glow — a 360px orange
 * gradient that follows the cursor across the card face, revealing depth on hover.
 *
 * Implemented as a CSS custom-property injection (`--sx` / `--sy`) so there
 * are zero React re-renders on mousemove. The visual is handled entirely by a
 * CSS `::after` pseudo-element on the `.spotlight-card` class (in index.css).
 *
 * Reduced-motion: the effect is display:none'd via the media query in CSS.
 *
 * Usage:
 *   <SpotlightCard className="rounded-xl border border-paper-line bg-paper-card p-5">
 *     …content…
 *   </SpotlightCard>
 */
export function SpotlightCard({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const { left, top } = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - left}px`);
    el.style.setProperty("--sy", `${e.clientY - top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn("spotlight-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}
