import { motion, useReducedMotion } from "framer-motion";

import { cn } from "../../lib/utils";

type DialProps = {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  /** Big caption under the number, e.g. "/100". Defaults to "/{max}". */
  unit?: string;
  /** Small uppercase label under the value. */
  label?: string;
  color?: string;
  className?: string;
};

/**
 * SVG confidence dial (donut) — the brand "Evidence Confidence 72/100".
 * Orange arc on a navy track; the arc animates 0→value on mount.
 */
export function Dial({
  value,
  max = 100,
  size = 148,
  thickness = 12,
  unit,
  label,
  color = "#d65a29",
  className,
}: DialProps) {
  const reduce = useReducedMotion();
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  const cx = size / 2;
  const cy = size / 2;
  const target = circumference * (1 - frac);

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e7dcc7" strokeWidth={thickness} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduce ? target : circumference }}
          animate={{ strokeDashoffset: target }}
          transition={{ duration: reduce ? 0 : 1.1, ease: "circOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold leading-none tabular-nums text-ink">
          {value}
          {unit ? <span className="align-top text-xl">{unit}</span> : null}
        </span>
        {label ? (
          <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
