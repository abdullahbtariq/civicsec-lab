import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useRef, useState } from "react";

import { CivicSignalCanvas, StaticSignalCore } from "./CivicSignalCanvas";
import { CivicSignalProgress } from "./CivicSignalProgress";
import { CivicSignalStagePanel } from "./CivicSignalStagePanel";
import { CIVIC_SIGNAL_STAGES } from "./civicSignalStages";
import "./civicSignalStory.css";

function CivicLegend() {
  return (
    <ul className="civic-legend" aria-hidden="true">
      <li><span className="civic-legend__line" /> Observed evidence</li>
      <li><span className="civic-legend__line civic-legend__line--dotted" /> Inferred relationship</li>
      <li><span className="civic-legend__dot" style={{ background: "#d65a29" }} /> Active signal</li>
      <li><span className="civic-legend__dot" style={{ background: "#e96565" }} /> High-risk signal</li>
      <li><span className="civic-legend__dot" style={{ background: "#7b8f79" }} /> Resolved</li>
    </ul>
  );
}

export function CivicSignalStory() {
  const reduce = useReducedMotion();
  const stages = CIVIC_SIGNAL_STAGES;
  const count = stages.length;

  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
    const idx = Math.min(count - 1, Math.max(0, Math.floor(v * count - 1e-4)));
    setActive((prev) => (prev === idx ? prev : idx));
  });

  // Reduced motion: static stacked cards, no pin, no continuous WebGL.
  if (reduce) {
    return (
      <section className="civic-story civic-story--static">
        <div className="civic-story__intro">
          <p className="civic-story__kicker">One signal. Six instruments. One response system.</p>
          <h2 className="civic-story__title">The Civic Signal Core</h2>
        </div>
        <div className="civic-static-list">
          {stages.map((s) => (
            <article key={s.id} className="civic-static-row">
              <StaticSignalCore className="civic-static-core" />
              <CivicSignalStagePanel stage={s} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="civic-story" style={{ height: `${count * 80}vh` }}>
      <div className="civic-story__sticky">
        <p className="civic-story__kicker">One signal. Six instruments. One response system.</p>

        <div className="civic-story__grid">
          <div className="civic-story__left">
            <CivicSignalProgress stages={stages} active={active} />
            <motion.div
              key={stages[active].id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <CivicSignalStagePanel stage={stages[active]} />
            </motion.div>
          </div>

          <div className="civic-story__canvas">
            <CivicSignalCanvas progressRef={progressRef} />
            <CivicLegend />
          </div>
        </div>
      </div>
    </section>
  );
}
