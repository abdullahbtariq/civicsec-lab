import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-paper-line bg-paper-card px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-orange/50 focus:ring-2 focus:ring-orange/15",
        className,
      )}
      {...props}
    />
  );
}
