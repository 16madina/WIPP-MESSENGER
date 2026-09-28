import { useWgoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Pre-keyed transparent character. No runtime green key, no plate behind it. */
export function PopAlpha({
  src,
  poster,
  loop = false,
  playKey = 0,
  tray = false,
  className,
}: {
  src: string;
  poster: string;
  loop?: boolean;
  playKey?: number;
  tray?: boolean;
  className?: string;
}) {
  const reduce = useWgoStore((s) => s.a11y.reduceMotion);
  if (reduce) {
    return <img src={poster} alt="" className={cn("size-full object-contain", className)} draggable={false} />;
  }
  const bust = loop ? src : `${src}${src.includes("?") ? "&" : "?"}k=${playKey}`;
  return (
    <div key={playKey} className={cn("pop-alpha", tray && "is-tray", className)} aria-hidden>
      <img src={bust} alt="" draggable={false} />
    </div>
  );
}
