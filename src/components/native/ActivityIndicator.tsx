import { motion, useTransform, type MotionValue } from "framer-motion";

/** Indicateur d'activité iOS à 8 branches. */
export function ActivityIndicator({ spinning, progress, size = 26 }: { spinning: boolean; progress?: MotionValue<number>; size?: number }) {
  const spokes = Array.from({ length: 8 });
  const rotate = useTransform(progress ?? ({ get: () => 1 } as unknown as MotionValue<number>), [0, 1], [-90, 0]);
  return (
    <motion.span
      className="relative block text-wipp-muted"
      style={{ width: size, height: size, rotate: spinning ? 0 : rotate, animation: spinning ? "wipp-spin 0.8s steps(8) infinite" : undefined }}
    >
      {spokes.map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-0 rounded-full bg-current"
          style={{ width: size * 0.09, height: size * 0.28, marginLeft: -size * 0.045, transformOrigin: `50% ${size / 2}px`, transform: `rotate(${i * 45}deg)`, opacity: 0.25 + (i / 8) * 0.75 }}
        />
      ))}
    </motion.span>
  );
}
