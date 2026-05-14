import type { SelectHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-10 w-full rounded-lg border border-civic-line bg-[#111418] px-3 py-2 text-sm text-white outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20",
        className,
      )}
      {...props}
    />
  );
}
