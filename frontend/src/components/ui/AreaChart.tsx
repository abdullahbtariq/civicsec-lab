import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import { cn } from "../../lib/utils";

type AreaChartProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  /** Compact mode for inline sparklines (no min padding, thinner). */
  sparkline?: boolean;
  /** Fixed scale bounds (e.g. 0..niceMax) so the line aligns with gridlines. */
  min?: number;
  max?: number;
  className?: string;
};

/**
 * Lightweight SVG area + line chart with an orange gradient fill — the brand
 * "Active Alerts Over Time". Stretches responsively to its container width.
 * The line draws in and the fill fades on mount (reduced-motion safe).
 * No charting dependency.
 */
export function AreaChart({
  data,
  width = 600,
  height = 160,
  color = "#d65a29",
  strokeWidth = 2,
  sparkline = false,
  min: minProp,
  max: maxProp,
  className,
}: AreaChartProps) {
  const reduce = useReducedMotion();
  const gid = useId().replace(/:/g, "");

  if (!data.length) return null;

  const pad = sparkline ? 2 : 8;
  const min = minProp ?? Math.min(...data);
  const max = maxProp ?? Math.max(...data);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(1, data.length - 1);

  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (d - min) / range);
    return [x, y] as const;
  });

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${(height - pad).toFixed(1)} L${pts[0][0].toFixed(1)} ${(height - pad).toFixed(1)} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={sparkline ? 0.28 : 0.34} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#area-${gid})`}
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.15 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 1.1, ease: "circOut" }}
      />
    </svg>
  );
}
