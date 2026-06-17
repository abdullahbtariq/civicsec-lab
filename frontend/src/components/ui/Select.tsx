import type { SelectHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-10 w-full rounded-lg border border-paper-line bg-paper-card px-3 py-2 text-sm text-ink outline-none transition focus:border-orange/50 focus:ring-2 focus:ring-orange/15",
        className,
      )}
      {...props}
    />
  );
}
