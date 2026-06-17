import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

import { cn } from "../../lib/utils";

const variants = {
  // Orange is the brand action color.
  primary:
    "border border-orange bg-orange text-white shadow-[0_8px_24px_-12px_rgba(214,90,41,0.7)] hover:bg-[#c24a1c]",
  secondary:
    "border border-paper-line bg-paper-card text-ink hover:border-orange/40 hover:bg-paper-raise",
  tertiary:
    "border border-paper-line bg-transparent text-ink hover:bg-paper-raise",
  ghost:
    "border border-transparent bg-transparent text-ink-soft hover:bg-paper-raise hover:text-ink",
  danger:
    "border border-rose/40 bg-rose/10 text-rose-ink hover:bg-rose/20",
};

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function ButtonLink({ className, variant = "secondary", ...props }: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
