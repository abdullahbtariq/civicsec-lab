import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** "page" → large display H1; "section" → title size H2. */
  level?: "page" | "section";
  className?: string;
};

/**
 * Consistent serif page/section header (brand editorial typography).
 */
export function SectionHeader({ title, subtitle, action, level = "section", className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1
          className={cn(
            "font-display font-bold tracking-tight text-ink text-balance",
            level === "page" ? "text-display" : "text-title",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
