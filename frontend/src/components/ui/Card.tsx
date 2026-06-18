import { useRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable the ReactBits spotlight hover effect on this card. */
  spotlight?: boolean;
}

export function Card({ className, spotlight = true, ...props }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = spotlight
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        const el = ref.current;
        if (!el) return;
        const { left, top } = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - left}px`);
        el.style.setProperty("--sy", `${e.clientY - top}px`);
      }
    : undefined;

  return (
    <div
      ref={spotlight ? ref : undefined}
      onMouseMove={handleMouseMove}
      className={cn(
        "rounded-xl border border-paper-line bg-paper-card shadow-card",
        spotlight && "spotlight-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-paper-line p-5 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
