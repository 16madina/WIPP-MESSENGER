import { animate, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import { motion as m } from "@/theme/theme";

type Opts = {
  /** Retourne une position à maintenir (ex. rafraîchissement) ou rien pour revenir à 0. */
  onRelease?: (pull: number) => number | void;
};

const rubber = (d: number) => {
  const a = Math.abs(d);
  return Math.sign(d) * m.rubberMax * (1 - 1 / ((a * m.rubberCoef) / m.rubberMax + 1));
};

/** Défilement élastique (rubber-band) en haut et en bas, via transform uniquement. */
export function useElastic(ref: RefObject<HTMLElement | null>, opts: Opts = {}) {
  const y = useMotionValue(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startY = 0;
    let base = 0;
    let mode: "top" | "bottom" | null = null;
    const atTop = () => el.scrollTop <= 0;
    const atBottom = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    const ts = (e: TouchEvent) => {
      startY = e.touches[0]!.clientY;
      mode = null;
      y.stop();
      base = y.get();
    };
    const tm = (e: TouchEvent) => {
      const cy = e.touches[0]!.clientY;
      if (!mode) {
        const dy = cy - startY;
        if (dy > 2 && (atTop() || base > 0)) mode = "top";
        else if (dy < -2 && atBottom()) mode = "bottom";
        else return;
        startY = cy;
      }
      const d = cy - startY;
      const v = mode === "top" ? Math.max(0, base + rubber(d)) : Math.min(0, rubber(d));
      y.set(v);
      if (e.cancelable) e.preventDefault();
    };
    const te = () => {
      if (!mode) return;
      mode = null;
      const hold = optsRef.current.onRelease?.(y.get());
      animate(y, typeof hold === "number" ? hold : 0, m.rubber);
    };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te);
    el.addEventListener("touchcancel", te);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("touchcancel", te);
    };
  }, [ref, y]);

  const settle = useCallback(() => animate(y, 0, m.rubber), [y]);
  return { y, settle };
}

/** Toucher à nouveau l'onglet actif : remonte en haut en douceur. */
export function useTabReselect(tabKey: string | undefined, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!tabKey) return;
    const h = (e: Event) => {
      if ((e as CustomEvent<string>).detail === tabKey) ref.current?.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("wipp:tab-reselect", h);
    return () => window.removeEventListener("wipp:tab-reselect", h);
  }, [tabKey, ref]);
}
