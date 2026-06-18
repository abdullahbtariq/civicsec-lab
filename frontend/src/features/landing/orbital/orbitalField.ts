// Vanilla three.js "orbital field" — a glowing core with six gyroscope ring-nodes
// in cinematic orbit, with bloom + a scroll-driven camera. Framework-agnostic:
// React owns the HTML overlays; this owns the canvas, raycasting, and camera.

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { ORBITAL_MODULES } from "./modules";

export type OrbitalHandle = {
  focus: (i: number) => void;
  exit: () => void;
  resize: () => void;
  dispose: () => void;
};

export type OrbitalPhase = "hero" | "why" | "core" | "explore" | "who" | "cred" | "outro";

export type OrbitalOpts = {
  reducedMotion: boolean;
  onHover: (i: number | null) => void;
  onSelect: (i: number) => void;
  onPhase: (p: OrbitalPhase) => void;
};

function phaseFor(t: number): OrbitalPhase {
  if (t < 0.1) return "hero";
  if (t < 0.25) return "why";
  if (t < 0.4) return "core";
  if (t < 0.62) return "explore";
  if (t < 0.76) return "who";
  if (t < 0.9) return "cred";
  return "outro";
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const EXPLORE: [number, number] = [0.4, 0.61];

function sprite(stops: [number, string][]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach((s) => g.addColorStop(s[0], s[1]));
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createOrbitalField(
  canvas: HTMLCanvasElement,
  labelsEl: HTMLElement,
  opts: OrbitalOpts,
): OrbitalHandle {
  const reduce = opts.reducedMotion;
  const small = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
  const coronaTex = sprite([
    [0, "rgba(255,200,150,1)"],
    [0.25, "rgba(240,140,70,.55)"],
    [0.6, "rgba(224,102,47,.12)"],
    [1, "rgba(224,102,47,0)"],
  ]);
  const dotTex = sprite([
    [0, "rgba(255,255,255,1)"],
    [0.4, "rgba(255,255,255,.5)"],
    [1, "rgba(255,255,255,0)"],
  ]);
  const nebTex = sprite([
    [0, "rgba(255,255,255,.5)"],
    [0.5, "rgba(255,255,255,.12)"],
    [1, "rgba(255,255,255,0)"],
  ]);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070f17);
  scene.fog = new THREE.FogExp2(0x070f17, 0.018);
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 1.6, 9.5);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), small ? 0.38 : 0.5, 0.6, 0.28);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  scene.add(new THREE.AmbientLight(0x2a3e52, 0.7));
  const coreLight = new THREE.PointLight(0xff8a4c, 3.0, 80, 1.5);
  scene.add(coreLight);

  const system = new THREE.Group();
  system.rotation.x = 0.12;
  scene.add(system);

  // central core (the sun)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0xe0662f, emissive: 0xf0843f, emissiveIntensity: 1.7, roughness: 0.45, metalness: 0.15 }),
  );
  system.add(core);
  const corona = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: coronaTex, color: 0xf0934a, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  corona.scale.setScalar(2.3);
  system.add(corona);
  const equator = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.014, 8, 140),
    new THREE.MeshBasicMaterial({ color: 0xf4ecdb, transparent: true, opacity: 0.32 }),
  );
  equator.rotation.x = (Math.PI / 2) * 0.8;
  system.add(equator);

  // faint nebula
  const nebG = new THREE.Group();
  scene.add(nebG);
  ([
    [0xe0662f, -18, 4, -26, 22], [0x3f74c4, 20, -6, -30, 26],
    [0xe7b052, 4, 12, -34, 20], [0x5f8c6e, -24, -10, -20, 18],
  ] as number[][]).forEach((n) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebTex, color: n[0], transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(n[1], n[2], n[3]);
    s.scale.setScalar(n[4]);
    nebG.add(s);
  });

  function starLayer(n: number, r0: number, r1: number, size: number, op: number, col: number) {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = r0 + Math.random() * (r1 - r0), th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.cos(ph);
      a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ map: dotTex, color: col, size, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  }
  const starsFar = starLayer(small ? 320 : 900, 40, 150, 0.5, 0.35, 0x9fb4c4);
  const starsNear = starLayer(small ? 140 : 350, 18, 55, 0.9, 0.55, 0xdfe8ef);
  scene.add(starsFar, starsNear);

  // drifting dust (flight)
  const DN = small ? 110 : 260;
  const dpos = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) {
    dpos[i * 3] = (Math.random() - 0.5) * 30;
    dpos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    dpos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ map: dotTex, color: 0xf0c79a, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // gyroscope ring-nodes
  type Node = {
    g: THREE.Group; dot: THREE.Mesh; rings: THREE.Mesh[]; atmo: THREE.Sprite;
    pathMat: THREE.LineBasicMaterial; el: HTMLDivElement; scale: number; target: number; fade: number;
    R: number; incl: number; spd: number; ph: number;
  };
  function orbitPos(R: number, incl: number, a: number) {
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    return new THREE.Vector3(x, -z * Math.sin(incl), z * Math.cos(incl));
  }
  const nodes: Node[] = [];
  const pick: THREE.Object3D[] = [];
  ORBITAL_MODULES.forEach((m, i) => {
    const seg = 180, arr = new Float32Array(seg * 3);
    for (let k = 0; k < seg; k++) {
      const p = orbitPos(m.R, m.incl, (k / seg) * Math.PI * 2);
      arr[k * 3] = p.x; arr[k * 3 + 1] = p.y; arr[k * 3 + 2] = p.z;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pathMat = new THREE.LineBasicMaterial({ color: m.color, transparent: true, opacity: 0.18 });
    system.add(new THREE.LineLoop(pg, pathMat));

    const g = new THREE.Group();
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 20),
      new THREE.MeshStandardMaterial({ color: m.color, emissive: new THREE.Color(m.color), emissiveIntensity: 2.2, roughness: 0.4, transparent: true }),
    );
    g.add(dot);
    const rings: THREE.Mesh[] = [];
    ([
      [0.52, 0xf4ecdb, 0.6, 1.57, 0, 0], [0.44, m.color, 0.95, 0, 1.2, 0.4], [0.36, 0xf4ecdb, 0.45, 0.6, 0.3, 1.1],
    ] as number[][]).forEach((rd) => {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(rd[0], 0.012, 8, 90),
        new THREE.MeshBasicMaterial({ color: rd[1], transparent: true, opacity: rd[2], blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      r.rotation.set(rd[3], rd[4], rd[5]);
      r.userData.base = rd[2];
      g.add(r);
      rings.push(r);
    });
    const atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: coronaTex, color: m.color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    atmo.scale.setScalar(1.5);
    g.add(atmo);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.userData.idx = i;
    g.add(hit);
    pick.push(hit);
    g.rotation.set(i * 0.5, i * 0.8, i * 0.3);
    system.add(g);

    const el = document.createElement("div");
    el.className = "ofx-olabel";
    el.innerHTML = `<span class="ofx-olabel-c">${m.sec}</span>${m.name}`;
    labelsEl.appendChild(el);

    nodes.push({ g, dot, rings, atmo, pathMat, el, scale: 1, target: 1, fade: 1, R: m.R, incl: m.incl, spd: m.spd, ph: m.ph });
  });

  // ---- interaction state ----
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hover = -1;
  let focusIdx = -1;
  let scrollT = 0;
  let scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  let lastPhase: OrbitalPhase | null = null;
  const ptr = { x: 0, y: 0 };
  const sm = { x: 0, y: 0 };

  function onPointerMove(e: PointerEvent) {
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ptr.x = ndc.x; ptr.y = ndc.y;
    if (focusIdx >= 0) { hover = -1; return; }
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pick, false);
    const next = h.length ? (h[0].object.userData.idx as number) : -1;
    if (next !== hover) { hover = next; opts.onHover(hover < 0 ? null : hover); }
    canvas.style.cursor = hover >= 0 ? "pointer" : "default";
  }
  function onClick() {
    if (focusIdx >= 0) return;
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pick, false);
    if (h.length) {
      const i = h[0].object.userData.idx as number;
      focusIdx = i;
      hover = -1;
      opts.onSelect(i);
    }
  }
  const onResize = () => resize();
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("click", onClick);
  window.addEventListener("resize", onResize, { passive: true });

  // ---- render loop ----
  const clock = new THREE.Clock();
  let ot = 0;
  let raf = 0;
  const tmp = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const lookCur = new THREE.Vector3(0, 0.55, 0);
  const fpos = new THREE.Vector3();

  function sph(R: number, theta: number, phi: number, out: THREE.Vector3) {
    out.set(R * Math.sin(phi) * Math.cos(theta), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(theta));
    return out;
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    // Read scroll every frame (single source of truth — robust vs. throttled listeners).
    scrollT = Math.min(1, Math.max(0, window.scrollY / scrollMax));
    const ph = phaseFor(scrollT);
    if (ph !== lastPhase) { lastPhase = ph; opts.onPhase(ph); }
    if (!reduce && focusIdx < 0) ot += dt;
    const inExplore = focusIdx < 0 && scrollT >= EXPLORE[0] && scrollT <= EXPLORE[1];

    nodes.forEach((o, i) => {
      const p = orbitPos(o.R, o.incl, ot * o.spd + o.ph);
      o.g.position.copy(p);
      o.target = i === hover ? 1.5 : i === focusIdx ? 1.8 : 1;
      o.scale = lerp(o.scale, o.target, 0.12);
      o.g.scale.setScalar(o.scale);
      const wf = focusIdx < 0 || i === focusIdx ? 1 : 0.06;
      o.fade = lerp(o.fade, wf, 0.1);
      if (!reduce) { o.rings[0].rotation.z += dt * 0.5; o.rings[1].rotation.x += dt * 0.7; o.rings[2].rotation.y += dt * 0.6; }
      const hot = i === hover || i === focusIdx ? 1.5 : 1;
      o.rings.forEach((r) => { (r.material as THREE.MeshBasicMaterial).opacity = (r.userData.base as number) * o.fade * hot; });
      const dm = o.dot.material as THREE.MeshStandardMaterial;
      dm.opacity = o.fade; dm.emissiveIntensity = 2.2 * o.fade * hot;
      o.atmo.material.opacity = o.fade * (i === hover || i === focusIdx ? 0.5 : 0.28);
      o.pathMat.opacity = o.fade * (inExplore ? 0.32 : 0.18);
      tmp.copy(p).applyMatrix4(system.matrixWorld).project(camera);
      o.el.style.left = `${(tmp.x * 0.5 + 0.5) * window.innerWidth}px`;
      o.el.style.top = `${(-tmp.y * 0.5 + 0.5) * window.innerHeight}px`;
      o.el.className = "ofx-olabel" + (i === hover ? " ofx-hot" : inExplore && tmp.z < 1 ? " ofx-show" : "");
    });

    core.scale.setScalar(1 + Math.sin(t * 1.1) * 0.02);
    corona.material.opacity = 0.28 + Math.sin(t * 0.9) * 0.05;
    if (!reduce) {
      system.rotation.y += 0.0009;
      equator.rotation.z = t * 0.08;
      starsFar.rotation.y = t * 0.004;
      starsNear.rotation.y = t * 0.007;
      nebG.rotation.z = t * 0.006;
      const a = dg.attributes.position.array as Float32Array;
      for (let i = 0; i < DN; i++) {
        a[i * 3 + 2] += dt * 1.6;
        if (a[i * 3 + 2] > 16) { a[i * 3 + 2] = -16; a[i * 3] = (Math.random() - 0.5) * 30; a[i * 3 + 1] = (Math.random() - 0.5) * 20; }
      }
      dg.attributes.position.needsUpdate = true;
    }
    coreLight.position.copy(system.position);

    sm.x = lerp(sm.x, ptr.x, 0.04);
    sm.y = lerp(sm.y, ptr.y, 0.04);
    if (focusIdx >= 0) {
      fpos.copy(nodes[focusIdx].g.position).applyMatrix4(system.matrixWorld);
      camPos.copy(fpos).add(tmp.copy(fpos).normalize().multiplyScalar(1.7));
      camPos.y += 0.35; camPos.x += 0.8;
      look.copy(fpos);
    } else {
      const reveal = ease(clamp(scrollT / 0.5));
      let R: number;
      if (scrollT < 0.14) R = lerp(9.5, 3.8, scrollT / 0.14);
      else R = lerp(3.8, 16, ease(clamp((scrollT - 0.14) / 0.36)));
      const theta = t * 0.035 + scrollT * 2.2 + sm.x * 0.4;
      const phi = lerp(1.42, 1.12, reveal) - sm.y * 0.16;
      sph(R, theta, phi, camPos);
      look.set(0, lerp(0.55, 0, clamp(scrollT / 0.14)), 0);
    }
    camera.position.lerp(camPos, reduce ? 1 : 0.06);
    lookCur.lerp(look, reduce ? 1 : 0.09);
    camera.lookAt(lookCur);
    composer.render();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  return {
    focus: (i: number) => { focusIdx = i; hover = -1; },
    exit: () => { focusIdx = -1; },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      labelsEl.innerHTML = "";
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
