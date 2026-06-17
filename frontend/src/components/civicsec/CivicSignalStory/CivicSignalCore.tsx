import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

import { CIVIC_COLORS as C } from "./civicSignalStages";

type Pt = [number, number, number];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function circle(r: number, seg = 72, z = 0): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    out.push([Math.cos(a) * r, Math.sin(a) * r, z]);
  }
  return out;
}
function ellipse(rx: number, ry: number, rot = 0, seg = 90): Pt[] {
  const out: Pt[] = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    out.push([x * c - y * s, x * s + y * c, 0]);
  }
  return out;
}
function rect(w: number, h: number, z = 0): Pt[] {
  const x = w / 2;
  const y = h / 2;
  return [
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], [-x, -y, z],
  ];
}
function sine(width: number, amp: number, freq: number, phase: number, seg = 80, z = 0): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const x = (t - 0.5) * width;
    out.push([x, Math.sin(t * Math.PI * 2 * freq + phase) * amp, z]);
  }
  return out;
}

/** Set opacity / scale / visibility for an entire system group. */
function applyWeight(group: THREE.Object3D | null, w: number) {
  if (!group) return;
  group.visible = w > 0.012;
  group.scale.setScalar(0.9 + 0.1 * w);
  group.traverse((o) => {
    const m = (o as unknown as { material?: THREE.Material & { opacity: number; transparent: boolean } }).material;
    if (!m) return;
    let base = 0.55; // lines
    if ((o as unknown as { isPoints?: boolean }).isPoints) base = 0.8;
    else if ((o as unknown as { isMesh?: boolean }).isMesh) base = o.userData?.plane ? 0.1 : 0.95;
    m.transparent = true;
    m.opacity = w * base;
  });
}

export function CivicSignalCore({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const root = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const threatRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const orbitDot = useRef<THREE.Mesh>(null);
  const privacyRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Group>(null);
  const wavesRef = useRef<THREE.Group>(null);
  const graphRef = useRef<THREE.Group>(null);
  const pathRef = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);

  // Dispersed-signal particle field
  const particles = useMemo(() => {
    const N = 130;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.1 + Math.random() * 3.1;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(a) * r;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    return arr;
  }, []);
  const signalPts = useMemo(() => {
    const N = 22;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.4 + Math.random() * 2.6;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(a) * r;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    return arr;
  }, []);

  const threatTicks = useMemo<Pt[][]>(() => {
    const ticks: Pt[][] = [];
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r0 = 2.9;
      const r1 = i % 3 === 0 ? 3.4 : 3.15;
      ticks.push([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a) * r1, Math.sin(a) * r1, 0]]);
    }
    return ticks;
  }, []);
  const threatNodes = useMemo(
    () =>
      [0.5, 1.4, 2.7, 4.1, 5.2].map((a) => ({ pos: [Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0] as Pt, risk: a > 4 })),
    [],
  );

  const waves = useMemo(
    () => [
      { pts: sine(7.2, 0.55, 1.4, 0, 90, 0), color: C.orange },
      { pts: sine(7.2, 0.9, 1.0, 1.1, 90, -0.2), color: C.gold },
      { pts: sine(7.2, 0.4, 2.0, 2.2, 90, 0.2), color: C.coral },
    ],
    [],
  );

  const graph = useMemo(() => {
    const nodes: { pos: Pt; color: string; r: number }[] = [
      { pos: [0, 0, 0], color: C.orange, r: 0.17 },
      { pos: [-2.3, 1.3, 0], color: C.navy, r: 0.1 },
      { pos: [2.1, 1.6, 0.2], color: C.coral, r: 0.11 },
      { pos: [-1.9, -1.6, 0], color: C.sage, r: 0.1 },
      { pos: [2.3, -1.2, -0.2], color: C.navy, r: 0.1 },
      { pos: [0.2, 2.5, 0], color: C.orange, r: 0.1 },
    ];
    const edges: [number, number][] = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [2, 4]];
    return { nodes, edges };
  }, []);

  const path = useMemo<Pt[]>(
    () => [[-3.2, -1.7, 0], [-1.4, -0.5, 0], [0, 0, 0], [1.3, 0.7, 0], [3.2, 1.7, 0]],
    [],
  );
  const gate = useMemo<Pt[]>(() => [[0, 0.55, 0], [0.55, 0, 0], [0, -0.55, 0], [-0.55, 0, 0], [0, 0.55, 0]], []);

  useFrame((state, dt) => {
    const p = clamp(progressRef.current ?? 0);
    const sp = p * 7;
    if (root.current) {
      root.current.rotation.z += dt * 0.035;
      root.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.06;
    }
    const bell = (c: number, s = 0.85) => Math.exp(-((sp - c) ** 2) / (2 * s * s));
    const fin = bell(7, 1.2);

    applyWeight(ringsRef.current, clamp(0.82 + 0.18 * bell(7, 2)));
    applyWeight(particlesRef.current, clamp(Math.max(bell(0, 1.15), 0.16)));
    applyWeight(threatRef.current, clamp(bell(1) + 0.2 * fin));
    applyWeight(orbitRef.current, clamp(bell(2) + 0.2 * fin));
    applyWeight(privacyRef.current, clamp(bell(3) + 0.2 * fin));
    applyWeight(wavesRef.current, clamp(bell(4) + 0.2 * fin));
    applyWeight(graphRef.current, clamp(bell(5) + 0.25 * fin));
    applyWeight(pathRef.current, clamp(bell(6) + 0.2 * fin));

    if (orbitDot.current) {
      const a = state.clock.elapsedTime * 0.5;
      orbitDot.current.position.set(Math.cos(a) * 2.5, Math.sin(a) * 1.2, 0);
    }
    if (scanRef.current) scanRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 1.0;

    const glowW = clamp(smoothstep(4, 7, sp) * 0.85 + 0.12);
    if (glow.current) {
      (glow.current.material as THREE.Material & { opacity: number }).opacity = glowW * 0.5;
      glow.current.scale.setScalar(0.55 + glowW * 0.9);
    }
  });

  const lineW = 1.1;

  return (
    <group ref={root}>
      {/* Central glow — RiskEvent core */}
      <mesh ref={glow}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={C.orange} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Core rings (always present) */}
      <group ref={ringsRef}>
        <Line points={circle(1.25)} color={C.navy} lineWidth={lineW} transparent opacity={0} />
        <Line points={circle(2.25)} color={C.navy} lineWidth={lineW} transparent opacity={0} />
        <Line points={circle(3.2)} color={C.navy} lineWidth={lineW} transparent opacity={0} dashed dashSize={0.18} gapSize={0.12} />
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color={C.orange} transparent opacity={0} />
        </mesh>
      </group>

      {/* Dispersed signal particles */}
      <group ref={particlesRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particles, 3]} />
          </bufferGeometry>
          <pointsMaterial color={C.navy} size={0.045} transparent opacity={0} sizeAttenuation depthWrite={false} />
        </points>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[signalPts, 3]} />
          </bufferGeometry>
          <pointsMaterial color={C.orange} size={0.08} transparent opacity={0} sizeAttenuation depthWrite={false} />
        </points>
      </group>

      {/* ThreatBoard — exposure ticks + perimeter nodes */}
      <group ref={threatRef}>
        {threatTicks.map((t, i) => (
          <Line key={i} points={t} color={C.navy} lineWidth={lineW} transparent opacity={0} />
        ))}
        {threatNodes.map((n, i) => (
          <mesh key={i} position={n.pos}>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshBasicMaterial color={n.risk ? C.coral : C.orange} transparent opacity={0} />
          </mesh>
        ))}
      </group>

      {/* LogLens — behavioural orbits + anomaly */}
      <group ref={orbitRef}>
        <Line points={ellipse(2.5, 1.2, -0.35)} color={C.navy} lineWidth={lineW} transparent opacity={0} />
        <Line points={ellipse(1.7, 2.6, 0.5)} color={C.navy} lineWidth={lineW} transparent opacity={0} dashed dashSize={0.2} gapSize={0.16} />
        <mesh ref={orbitDot}>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshBasicMaterial color={C.orange} transparent opacity={0} />
        </mesh>
        <mesh position={[-2.2, 1.9, 0]}>
          <sphereGeometry args={[0.12, 14, 14]} />
          <meshBasicMaterial color={C.coral} transparent opacity={0} />
        </mesh>
      </group>

      {/* DataPrivacy Doctor — layered planes + scan */}
      <group ref={privacyRef}>
        {[-0.5, 0, 0.5].map((z, i) => (
          <group key={i}>
            <mesh position={[0, 0, z]} userData={{ plane: true }}>
              <planeGeometry args={[4.4, 3]} />
              <meshBasicMaterial color={C.navy} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Line points={rect(4.4, 3, z)} color={C.navy} lineWidth={lineW} transparent opacity={0} />
          </group>
        ))}
        <group ref={scanRef}>
          <Line points={[[-2.2, 0, 0.6], [2.2, 0, 0.6]]} color={C.orange} lineWidth={1.4} transparent opacity={0} />
        </group>
        <mesh position={[-1.2, 0.7, 0.6]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color={C.coral} transparent opacity={0} />
        </mesh>
      </group>

      {/* Misinformation Observatory — narrative waves */}
      <group ref={wavesRef}>
        {waves.map((w, i) => (
          <Line key={i} points={w.pts} color={w.color} lineWidth={lineW} transparent opacity={0} />
        ))}
      </group>

      {/* Civic Risk Graph — node-link constellation */}
      <group ref={graphRef}>
        {graph.edges.map(([a, b], i) => (
          <Line key={i} points={[graph.nodes[a].pos, graph.nodes[b].pos]} color={C.navy} lineWidth={lineW} transparent opacity={0} />
        ))}
        {graph.nodes.map((n, i) => (
          <mesh key={i} position={n.pos}>
            <sphereGeometry args={[n.r, 16, 16]} />
            <meshBasicMaterial color={n.color} transparent opacity={0} />
          </mesh>
        ))}
      </group>

      {/* IncidentFlow — response route + review gate */}
      <group ref={pathRef}>
        <Line points={path} color={C.navy} lineWidth={lineW} transparent opacity={0} />
        <Line points={gate} color={C.orange} lineWidth={1.3} transparent opacity={0} />
        <mesh position={path[0]}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshBasicMaterial color={C.orange} transparent opacity={0} />
        </mesh>
        <mesh position={path[path.length - 1]}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshBasicMaterial color={C.sage} transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
}
