import { cn } from "../../../lib/utils";
import type { CivicSignalStage } from "./civicSignalStages";

export function CivicSignalProgress({ stages, active }: { stages: CivicSignalStage[]; active: number }) {
  return (
    <ol className="civic-rail" aria-label="Story progress">
      {stages.map((s, i) => (
        <li
          key={s.id}
          className={cn("civic-rail__item", i === active && "is-active", i < active && "is-done")}
        >
          <span className="civic-rail__dot" aria-hidden="true" />
          <span className="civic-rail__label">{s.moduleName}</span>
        </li>
      ))}
    </ol>
  );
}
