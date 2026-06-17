import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

type Variant = "info" | "warning" | "critical" | "success";

const config: Record<Variant, { icon: LucideIcon; ring: string; tint: string; accent: string }> = {
  info:     { icon: Info,          ring: "border-bluec/30", tint: "bg-bluec/8",  accent: "text-bluec-ink" },
  warning:  { icon: AlertTriangle, ring: "border-gold/40",  tint: "bg-gold/12",  accent: "text-gold-ink" },
  critical: { icon: ShieldAlert,   ring: "border-rose/30",  tint: "bg-rose/10",  accent: "text-rose-ink" },
  success:  { icon: CheckCircle2,  ring: "border-sage/30",  tint: "bg-sage/12",  accent: "text-sage-ink" },
};

type CalloutProps = {
  variant?: Variant;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

/**
 * Branded alert / message block on the cream surface. Full border + soft tint,
 * leading icon, title, body, optional action.
 */
export function Callout({ variant = "info", title, children, action, icon, className }: CalloutProps) {
  const c = config[variant];
  const Icon = icon ?? c.icon;
  return (
    <div className={cn("rounded-xl border px-4 py-3.5", c.ring, c.tint, className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          <Icon aria-hidden="true" className={cn("mt-0.5 h-5 w-5 shrink-0", c.accent)} />
          <div className="min-w-0 text-sm">
            {title ? <p className={cn("font-semibold", c.accent)}>{title}</p> : null}
            {children ? <div className={cn("text-ink-soft", title && "mt-0.5")}>{children}</div> : null}
          </div>
        </div>
        {action ? <div className="shrink-0 sm:pl-2">{action}</div> : null}
      </div>
    </div>
  );
}
