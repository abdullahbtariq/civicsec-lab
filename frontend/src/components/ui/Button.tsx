import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

import { cn } from "../../lib/utils";

const variants = {
  primary: "border-civic-teal/50 bg-civic-teal text-[#091311] hover:bg-[#6ee8c4]",
  secondary: "border-civic-line bg-[#20252b] text-civic-text hover:bg-[#2a3037]",
  ghost: "border-transparent bg-transparent text-civic-muted hover:bg-[#20252b] hover:text-white",
  danger: "border-civic-rose/50 bg-civic-rose/15 text-civic-rose hover:bg-civic-rose/25",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-civic-teal/70 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function ButtonLink({ className, variant = "secondary", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-civic-teal/70",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
