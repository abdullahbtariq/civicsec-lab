import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-civic-line bg-[#111418] px-3 py-2 text-sm text-white outline-none transition placeholder:text-civic-muted focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20",
        className,
      )}
      {...props}
    />
  );
}
