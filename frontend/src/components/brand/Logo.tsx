import { cn } from "../../lib/utils";
import { BrandMark } from "./BrandMark";

type LogoProps = {
  variant?: "horizontal" | "stacked";
  /** Mark pixel size. Default 36. */
  markSize?: number;
  /** Small line under the wordmark (e.g. organisation name). */
  subtitle?: string;
  /** Show the brand tagline as the subtitle line (overridden by `subtitle`). */
  tagline?: boolean;
  boxed?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

const TAGLINE = "Open-source civic risk infrastructure";

/**
 * Brand lockup: the radar mark + "CivicSec Lab" serif wordmark, with an
 * optional subtitle (org name) or the brand tagline.
 */
export function Logo({
  variant = "horizontal",
  markSize = 36,
  subtitle,
  tagline = false,
  boxed = false,
  className,
  wordmarkClassName,
}: LogoProps) {
  const sub = subtitle ?? (tagline ? TAGLINE : undefined);

  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-3",
        variant === "stacked" && "flex-col gap-2 text-center",
        className,
      )}
    >
      <BrandMark size={markSize} boxed={boxed} title="" />
      <span className={cn("flex min-w-0 flex-col", variant === "stacked" && "items-center")}>
        <span
          className={cn(
            "font-display font-semibold leading-none tracking-tight text-civic-text",
            markSize >= 40 ? "text-xl" : "text-base",
            wordmarkClassName,
          )}
        >
          CivicSec&nbsp;Lab
        </span>
        {sub ? (
          <span
            className={cn(
              "mt-1 truncate text-[11px] leading-tight",
              tagline && !subtitle
                ? "font-semibold uppercase tracking-[0.08em] text-civic-teal"
                : "text-civic-muted",
            )}
          >
            {sub}
          </span>
        ) : null}
      </span>
    </span>
  );
}
