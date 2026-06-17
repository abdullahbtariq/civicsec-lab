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
    <div className="rounded-xl border border-dashed border-civic-line bg-civic-panel/60 px-6 py-8">
      <h3 className="font-display text-base font-semibold text-civic-text">{title}</h3>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-civic-muted">{description}</p>
      )}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
