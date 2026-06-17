import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The Civic Signal Core — a calm, performant instrument that *resolves* as the
 * story scrolls: dispersed signal particles, six module nodes, and a network
 * that brightens into one glowing RiskEvent core.
 *
 * Performance: geometry is built once. Per frame we only rotate the group,
 * lerp a few scalars, pulse 6 node colours, and drift ~70 particles. The
 * connection lines are STATIC geometry — only their material opacity changes
 * (no per-frame O(n²) rebuild, which is what made the old version janky).
 */

const PARTICLES = 70;
const BOUNDS = 5;
const NODE_COUNT = 6;

// Six module nodes around the core (brand-accent colours, muted for dark bg).
const NODES: { pos: [number, number, number]; c: [number, number, number] }[] = [
  { pos: [-2.7, 0.7, 0.4], c: [0.84, 0.35, 0.16] },  // ThreatBoard — orange
  { pos: [2.5, -0.4, 1.0], c: [0.81, 0.61, 0.27] },  // LogLens — gold
  { pos: [-0.5, 2.5, -1.0], c: [0.44, 0.65, 1.0] },  // Privacy — blue
  { pos: [1.1, -2.4, 0.5], c: [0.49, 0.56, 0.47] },  // Observatory — sage
  { pos: [-2.0, -1.4, -0.7], c: [0.91, 0.42, 0.42] },// Risk Graph — coral
  { pos: [2.3, 1.9, 0.0], c: [0.95, 0.90, 0.80] },   // IncidentFlow — cream
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function circle(r: number, seg = 96): Float32Array {
  const a = new Float32Array(seg * 3);
  for (let i = 0; i < seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    a[i * 3] = Math.cos(t) * r;
    a[i * 3 + 1] = Math.sin(t) * r;
    a[i * 3 + 2] = 0;
  }
  return a;
}

function Scene({ progressRef }: { progressRef: { current: number } }) {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const nodeGeo = useRef<THREE.BufferGeometry>(null);
  const partGeo = useRef<THREE.BufferGeometry>(null);
  const sp = useRef(0);

  const data = useMemo(() => {
    const ringPts = [circle(1.45), circle(2.45), circle(3.45)];

    // Drifting signal particles
    const particles = new Float32Array(PARTICLES * 3);
    const velocities = new Float32Array(PARTICLES * 3);
    const partColors = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.4 + Math.random() * 3.4;
      particles[i * 3] = Math.cos(a) * r;
      particles[i * 3 + 1] = Math.sin(a) * r;
      particles[i * 3 + 2] = (Math.random() - 0.5) * 2;
      velocities[i * 3] = (Math.random() - 0.5) * 0.004;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
      if (Math.random() < 0.78) {
        partColors[i * 3] = 0.55; partColors[i * 3 + 1] = 0.5; partColors[i * 3 + 2] = 0.42; // cream-dim
      } else {
        partColors[i * 3] = 0.84; partColors[i * 3 + 1] = 0.35; partColors[i * 3 + 2] = 0.16; // orange
      }
    }

    // Six module nodes
    const nodePos = new Float32Array(NODE_COUNT * 3);
    const nodeColors = new Float32Array(NODE_COUNT * 3);
    const nodeBase = new Float32Array(NODE_COUNT * 3);
    NODES.forEach((n, i) => {
      nodePos[i * 3] = n.pos[0]; nodePos[i * 3 + 1] = n.pos[1]; nodePos[i * 3 + 2] = n.pos[2];
      nodeColors[i * 3] = nodeBase[i * 3] = n.c[0];
      nodeColors[i * 3 + 1] = nodeBase[i * 3 + 1] = n.c[1];
      nodeColors[i * 3 + 2] = nodeBase[i * 3 + 2] = n.c[2];
    });

    // Static connection lines: node→core + node→next (ring)
    const edges: [number, number][] = [];
    for (let i = 0; i < NODE_COUNT; i++) edges.push([i, -1]); // -1 = core
    for (let i = 0; i < NODE_COUNT; i++) edges.push([i, (i + 1) % NODE_COUNT]);
    const linePositions = new Float32Array(edges.length * 6);
    edges.forEach((e, k) => {
      const o = k * 6;
      const a = e[0];
      linePositions[o] = NODES[a].pos[0]; linePositions[o + 1] = NODES[a].pos[1]; linePositions[o + 2] = NODES[a].pos[2];
      if (e[1] === -1) {
        linePositions[o + 3] = 0; linePositions[o + 4] = 0; linePositions[o + 5] = 0;
      } else {
        const b = e[1];
        linePositions[o + 3] = NODES[b].pos[0]; linePositions[o + 4] = NODES[b].pos[1]; linePositions[o + 5] = NODES[b].pos[2];
      }
    });

    return { ringPts, particles, velocities, partColors, nodePos, nodeColors, nodeBase, linePositions };
  }, []);

  useFrame((state) => {
    const p = clamp(progressRef.current ?? 0);
    sp.current += (p - sp.current) * 0.05; // smooth
    // The story's chapters resolve by progress ~0.62 (the rest is scroll-away),
    // so map the Core's resolve into that window — fully formed when "one core" shows.
    const s = clamp(sp.current / 0.62);
    const t = state.clock.elapsedTime;

    if (group.current) group.current.rotation.y += 0.0009;
    // gentle push-in as the core resolves
    state.camera.position.z += (8.7 - s * 1.3 - state.camera.position.z) * 0.04;

    if (rings.current) {
      rings.current.scale.setScalar(0.97 + Math.sin(t * 0.4) * 0.008 + s * 0.05);
      rings.current.rotation.z = s * 0.25;
    }
    if (glow.current) {
      glow.current.scale.setScalar(0.4 + s * 1.05);
      (glow.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + s * 0.42;
    }
    if (lineMat.current) lineMat.current.opacity = 0.05 + s * 0.4;

    // pulse + brighten module nodes (cheap — 6 points)
    if (nodeGeo.current) {
      const col = nodeGeo.current.attributes.color as THREE.BufferAttribute;
      const arr = col.array as Float32Array;
      for (let i = 0; i < NODE_COUNT; i++) {
        const bright = (0.6 + 0.4 * Math.sin(t * 1.0 + i * 1.1)) * (0.7 + s * 0.7);
        arr[i * 3] = data.nodeBase[i * 3] * bright;
        arr[i * 3 + 1] = data.nodeBase[i * 3 + 1] * bright;
        arr[i * 3 + 2] = data.nodeBase[i * 3 + 2] * bright;
      }
      col.needsUpdate = true;
    }

    // drift particles
    if (partGeo.current) {
      const pos = partGeo.current.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const v = data.velocities;
      for (let i = 0; i < PARTICLES * 3; i++) {
        arr[i] += v[i];
        if (arr[i] > BOUNDS || arr[i] < -BOUNDS) v[i] *= -1;
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* central RiskEvent core glow */}
      <mesh ref={glow}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#d65a29" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* concentric rings */}
      <group ref={rings}>
        {data.ringPts.map((pts, i) => (
          <lineLoop key={i}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[pts, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#efe6d4" transparent opacity={0.18} depthWrite={false} />
          </lineLoop>
        ))}
      </group>

      {/* static connection network (opacity lerps with scroll) */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={lineMat} color="#e7c39c" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* six module nodes */}
      <points>
        <bufferGeometry ref={nodeGeo}>
          <bufferAttribute attach="attributes-position" args={[data.nodePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.16} sizeAttenuation vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* dispersed signal particles */}
      <points>
        <bufferGeometry ref={partGeo}>
          <bufferAttribute attach="attributes-position" args={[data.particles, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.partColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} sizeAttenuation vertexColors transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

export function WebGLHero({ progressRef }: { progressRef: { current: number } }) {
  return (
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <Canvas
        camera={{ fov: 52, position: [0, 0, 8.7] }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene progressRef={progressRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
