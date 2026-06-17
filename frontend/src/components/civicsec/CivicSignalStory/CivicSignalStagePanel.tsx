import { Link } from "react-router-dom";

import type { CivicSignalStage } from "./civicSignalStages";

export function CivicSignalStagePanel({ stage }: { stage: CivicSignalStage }) {
  return (
    <div className="civic-panel">
      <p className="civic-panel__eyebrow">{stage.label}</p>
      <h3 className="civic-panel__module">{stage.moduleName}</h3>
      <h2 className="civic-panel__headline">{stage.headline}</h2>
      <p className="civic-panel__desc">{stage.description}</p>

      <dl className="civic-panel__flow">
        <div>
          <dt>Signal in</dt>
          <dd>{stage.signalIn}</dd>
        </div>
        <div>
          <dt>Transform</dt>
          <dd>{stage.transform}</dd>
        </div>
        <div>
          <dt>Output</dt>
          <dd>{stage.output}</dd>
        </div>
      </dl>

      <div className="civic-panel__chips">
        {stage.audience.map((a) => (
          <span key={a} className="civic-chip">{a}</span>
        ))}
      </div>

      <Link to={stage.ctaTo} className="civic-panel__cta">
        {stage.ctaLabel}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
