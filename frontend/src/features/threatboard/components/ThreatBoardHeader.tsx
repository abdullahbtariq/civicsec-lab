import type { ReactNode } from "react";

export function ThreatBoardHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">{subtitle}</p>
        </div>
        {children}
      </div>
      <div className="rounded-lg border border-paper-line bg-paper-card p-4">
        <p className="text-sm leading-6 text-ink-soft">
          ThreatBoard uses public vulnerability metadata for defensive prioritisation. It does not
          provide exploit code or offensive instructions.
        </p>
      </div>
    </section>
  );
}
