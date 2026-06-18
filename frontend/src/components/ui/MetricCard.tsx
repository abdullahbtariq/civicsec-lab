import { useRef } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/utils";
import { AreaChart } from "./AreaChart";

type Tone = "ink" | "orange" | "rose";

const valueTone: Record<Tone, string> = {
  ink:    "text-ink",
  orange: "text-orange",
  rose:   "text-rose-ink",
};

const sparkColor: Record<Tone, string> = {
  ink:    "#54707d",
  orange: "#d65a29",
  rose:   "#d6452f",
};

type MetricCardProps = {
  label: string;
  value: number | string;
  tone?: Tone;
  subtitle?: string;
  sparkline?: number[];
  /** Faint radar watermark (for "steady" metrics with no trend line). */
  watermark?: boolean;
  to?: string;
  className?: string;
};

function RadarWatermark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 80 80"
      className="pointer-events-none absolute -right-2 top-1/2 h-24 w-24 -translate-y-1/2 text-ink"
      fill="none"
    >
      <circle cx="40" cy="40" r="30" stroke="currentColor" strokeOpacity="0.12" />
      <circle cx="40" cy="40" r="20" stroke="currentColor" strokeOpacity="0.12" />
      <circle cx="40" cy="40" r="10" stroke="currentColor" strokeOpacity="0.12" />
      <line x1="40" y1="6"  x2="40" y2="74" stroke="currentColor" strokeOpacity="0.08" />
      <line x1="6"  y1="40" x2="74" y2="40" stroke="currentColor" strokeOpacity="0.08" />
      <circle cx="40" cy="40" r="2.5" fill="#d65a29" fillOpacity="0.6" />
      <circle cx="58" cy="28" r="1.6" fill="#d65a29" fillOpacity="0.5" />
    </svg>
  );
}

/**
 * Brand metric tile (Command Center): small-caps label, large serif number,
 * subtitle, and either an orange sparkline (trending metrics) or a faint radar
 * watermark (steady metrics).
 *
 * Includes the ReactBits spotlight hover effect — mouse-tracking radial glow
 * via CSS custom properties (zero re-renders).
 */
export function MetricCard({
  label,
  value,
  tone = "ink",
  subtitle,
  sparkline,
  watermark,
  to,
  className,
}: MetricCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top } = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - left}px`);
    el.style.setProperty("--sy", `${e.clientY - top}px`);
  };

  const body = (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      className={cn(
        // Layout
        "spotlight-card relative flex h-full flex-col overflow-hidden",
        // Appearance
        "rounded-xl border border-paper-line bg-paper-card p-5 shadow-card",
        // Hover border lift (when wrapped in Link)
        to && "group-hover:border-orange/40",
        // Transition
        "transition-colors duration-200",
        className,
      )}
    >
      {watermark ? <RadarWatermark /> : null}

      <p className="relative text-label font-semibold uppercase text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          "relative mt-2 font-display text-[2.75rem] font-bold leading-none tabular-nums",
          valueTone[tone],
        )}
      >
        {value}
      </p>
      {subtitle ? (
        <p className="relative mt-1.5 text-xs text-ink-soft">{subtitle}</p>
      ) : null}

      {/* Reserved sparkline lane — in-flow, cannot collide with the subtitle */}
      {sparkline && sparkline.length > 1 ? (
        <div className="pointer-events-none relative mt-auto pt-4">
          <AreaChart
            data={sparkline}
            height={36}
            strokeWidth={1.75}
            sparkline
            color={sparkColor[tone]}
          />
        </div>
      ) : null}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {body}
      </Link>
    );
  }
  return body;
}
