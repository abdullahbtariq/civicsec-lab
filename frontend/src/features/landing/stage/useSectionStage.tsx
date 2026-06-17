/**
 * Signal Field — stage system.
 *
 * Sections of the marketing pages register themselves as "stages". A single
 * rAF loop tracks which stage owns the viewport centre, the scroll progress,
 * and a smoothed pointer position. That snapshot is exposed two ways:
 *
 *  - `snapshot` (a mutable ref) for the WebGL render loop — read every frame
 *    with zero React re-renders.
 *  - `activeIndex` / `activeCode` / `sections` (React state) for the HUD,
 *    which only needs to update when the active section changes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type StageId =
  | "core"
  | "dispersed"
  | "constellation"
  | "stream"
  | "lattice"
  | "resolved";

export type StageMeta = {
  key: string;
  label: string;
  code: StageId;
  el: HTMLElement;
};

export type StageSnapshot = {
  activeKey: string | null;
  activeIndex: number;
  code: StageId;
  /** Global scroll progress across the whole page, 0..1. */
  progress: number;
  /** Progress within the active section, 0..1. */
  localProgress: number;
  /** Smoothed pointer, each axis -1..1. */
  pointer: { x: number; y: number };
};

export type SectionInfo = { key: string; label: string; code: StageId };

type StageContextValue = {
  register: (meta: StageMeta) => () => void;
  snapshot: React.MutableRefObject<StageSnapshot>;
  activeIndex: number;
  activeCode: StageId;
  sections: SectionInfo[];
  scrollTo: (key: string) => void;
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const StageContext = createContext<StageContextValue | null>(null);

export function StageProvider({ children }: { children: ReactNode }) {
  const metas = useRef<StageMeta[]>([]);
  const snapshot = useRef<StageSnapshot>({
    activeKey: null,
    activeIndex: 0,
    code: "core",
    progress: 0,
    localProgress: 0,
    pointer: { x: 0, y: 0 },
  });
  const pointerTarget = useRef({ x: 0, y: 0 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCode, setActiveCode] = useState<StageId>("core");
  const [sections, setSections] = useState<SectionInfo[]>([]);

  // Order registered metas by document position so the rail + detection agree.
  const reorder = useCallback(() => {
    metas.current.sort((a, b) => {
      const pos = a.el.compareDocumentPosition(b.el);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    setSections(metas.current.map((m) => ({ key: m.key, label: m.label, code: m.code })));
  }, []);

  const register = useCallback(
    (meta: StageMeta) => {
      metas.current = [...metas.current.filter((m) => m.key !== meta.key), meta];
      reorder();
      return () => {
        metas.current = metas.current.filter((m) => m.key !== meta.key);
        reorder();
      };
    },
    [reorder],
  );

  const scrollTo = useCallback((key: string) => {
    const meta = metas.current.find((m) => m.key === key);
    meta?.el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Pointer target (raw); smoothed in the rAF loop below.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerTarget.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Single rAF: compute active stage + progress, smooth pointer, push snapshot.
  useEffect(() => {
    let raf = 0;
    let lastIndex = -1;

    const tick = () => {
      const list = metas.current;
      const vh = window.innerHeight;
      const centre = vh * 0.5;

      let activeIdx = 0;
      let local = 0;
      for (let i = 0; i < list.length; i++) {
        const r = list[i].el.getBoundingClientRect();
        if (r.top <= centre && r.bottom >= centre) {
          activeIdx = i;
          local = clamp((centre - r.top) / Math.max(1, r.height));
          break;
        }
        // Past this section entirely — keep advancing the candidate.
        if (r.bottom < centre) {
          activeIdx = Math.min(i + 1, Math.max(0, list.length - 1));
          local = 0;
        }
      }

      const active = list[activeIdx];
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - vh);
      const progress = clamp(window.scrollY / maxScroll);

      // Smooth pointer toward target.
      const p = snapshot.current.pointer;
      p.x += (pointerTarget.current.x - p.x) * 0.06;
      p.y += (pointerTarget.current.y - p.y) * 0.06;

      const snap = snapshot.current;
      snap.activeKey = active?.key ?? null;
      snap.activeIndex = activeIdx;
      snap.code = active?.code ?? "core";
      snap.progress = progress;
      snap.localProgress = local;

      if (activeIdx !== lastIndex && active) {
        lastIndex = activeIdx;
        setActiveIndex(activeIdx);
        setActiveCode(active.code);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const value = useMemo<StageContextValue>(
    () => ({ register, snapshot, activeIndex, activeCode, sections, scrollTo }),
    [register, activeIndex, activeCode, sections, scrollTo],
  );

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function useSectionStage(): StageContextValue {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error("useSectionStage must be used within <StageProvider>");
  return ctx;
}

/**
 * Wraps a marketing section: registers it as a stage and renders a <section>
 * with the id, so the field + HUD can track it and the rail can scroll to it.
 */
export function Stage({
  id,
  label,
  code,
  className,
  children,
}: {
  id: string;
  label: string;
  code: StageId;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { register } = useSectionStage();

  useEffect(() => {
    if (!ref.current) return;
    return register({ key: id, label, code, el: ref.current });
  }, [id, label, code, register]);

  return (
    <section ref={ref} id={id} data-stage={code} className={className}>
      {children}
    </section>
  );
}
