import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

/**
 * Light-surface chips: soft tinted background + dark, readable ink text.
 * Variant names kept stable so existing call sites don't change.
 */
const variants = {
  neutral: "border-paper-line bg-paper-raise text-ink-soft",
  teal:    "border-orange/30 bg-orange/12 text-orange-ink",   // accent (brand orange)
  amber:   "border-gold/40 bg-gold/15 text-gold-ink",
  rose:    "border-rose/30 bg-rose/12 text-rose-ink",
  blue:    "border-bluec/30 bg-bluec/12 text-bluec-ink",
  sage:    "border-sage/30 bg-sage/15 text-sage-ink",
  slate:   "border-slatec/30 bg-slatec/12 text-slatec-ink",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
