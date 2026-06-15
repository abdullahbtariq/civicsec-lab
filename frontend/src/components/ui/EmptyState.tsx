import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-civic-line/50 bg-[#14181d] px-6 py-8">
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-civic-muted">{description}</p>
      )}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
