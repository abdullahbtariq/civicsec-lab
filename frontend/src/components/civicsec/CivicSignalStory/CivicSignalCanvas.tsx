import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { MutableRefObject } from "react";

import { CivicSignalCore } from "./CivicSignalCore";

/** Simplified static instrument — Suspense fallback + reduced-motion view. */
export function StaticSignalCore({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="#0f2230" strokeOpacity="0.45" strokeWidth="1">
        <circle cx="160" cy="160" r="120" />
        <circle cx="160" cy="160" r="84" />
        <circle cx="160" cy="160" r="48" strokeDasharray="4 4" />
        <line x1="160" y1="20" x2="160" y2="300" strokeOpacity="0.16" />
        <line x1="20" y1="160" x2="300" y2="160" strokeOpacity="0.16" />
        <line x1="160" y1="160" x2="244" y2="92" />
        <line x1="160" y1="160" x2="92" y2="232" />
      </g>
      <circle cx="160" cy="160" r="7" fill="#d65a29" />
      <circle cx="244" cy="92" r="5" fill="#d65a29" />
      <circle cx="92" cy="232" r="5" fill="#7b8f79" />
      <circle cx="232" cy="208" r="5" fill="#e96565" />
      <circle cx="108" cy="96" r="4" fill="#0f2230" />
    </svg>
  );
}

export function CivicSignalCanvas({ progressRef }: { progressRef: MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <CivicSignalCore progressRef={progressRef} />
      </Suspense>
    </Canvas>
  );
}
