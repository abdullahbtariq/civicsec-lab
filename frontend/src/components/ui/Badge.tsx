import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

const variants = {
  neutral: "border-civic-line bg-[#20252b] text-civic-muted",
  teal: "border-civic-teal/40 bg-civic-teal/10 text-civic-teal",
  amber: "border-civic-amber/40 bg-civic-amber/10 text-civic-amber",
  rose: "border-civic-rose/40 bg-civic-rose/10 text-civic-rose",
  blue: "border-civic-blue/40 bg-civic-blue/10 text-civic-blue",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
