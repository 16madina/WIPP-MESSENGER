import { useRef, useState } from "react";
import { Lock, Mic } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const CANCEL_X = 90;
const LOCK_Y = 70;

/**
 * Micro : maintenir → enregistrer ; glisser à gauche → annuler ;
 * glisser vers le haut → verrouiller ; relâcher → envoyer.
 * Un simple toucher démarre directement en mode verrouillé.
 */
export function HoldMic({
  onStart,
  onCancel,
  onLock,
  onRelease,
  onDrag,
  label,
}: {
  onStart: () => void;
  onCancel: () => void;
  onLock: () => void;
  onRelease: () => void;
  onDrag?: (dx: number, dy: number) => void;
  label: string;
}) {
  const cb = useRef({ onStart, onCancel, onLock, onRelease, onDrag });
  cb.current = { onStart, onCancel, onLock, onRelease, onDrag };
  const origin = useRef<{ x: number; y: number; at: number; done: boolean } | null>(null);
  const [holding, setHolding] = useState(false);
  const [lift, setLift] = useState(0);

  function end(fire: "release" | "cancel" | "lock" | null) {
    origin.current = null;
    setHolding(false);
    setLift(0);
    cb.current.onDrag?.(0, 0);
    if (fire === "release") cb.current.onRelease();
    if (fire === "cancel") cb.current.onCancel();
    if (fire === "lock") cb.current.onLock();
  }

  return (
    <div className="relative mb-0.5 shrink-0">
      {holding ? (
        <span
          className="absolute bottom-12 left-1/2 flex h-24 w-9 -translate-x-1/2 flex-col items-center justify-start rounded-full bg-surface-2 pt-2 ring-1 ring-hair"
          aria-hidden
        >
          <Lock className={cn("size-4 transition-colors", lift > LOCK_Y * 0.7 ? "text-accent" : "text-muted")} />
          <span className="mt-1 text-[10px] text-muted">▲</span>
        </span>
      ) : null}
      <button
        type="button"
        aria-label={label}
        className={cn(
          "press flex size-9 touch-none items-center justify-center rounded-full text-fg transition-transform",
          holding && "scale-125 bg-danger text-paper",
        )}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          origin.current = { x: e.clientX, y: e.clientY, at: Date.now(), done: false };
          setHolding(true);
          haptic("light");
          cb.current.onStart();
        }}
        onPointerMove={(e) => {
          const o = origin.current;
          if (!o || o.done) return;
          const dx = Math.min(0, e.clientX - o.x);
          const dy = Math.min(0, e.clientY - o.y);
          setLift(-dy);
          cb.current.onDrag?.(dx, dy);
          if (-dx > CANCEL_X) {
            o.done = true;
            haptic("warning");
            end("cancel");
          } else if (-dy > LOCK_Y) {
            o.done = true;
            haptic("success");
            end("lock");
          }
        }}
        onPointerUp={() => {
          const o = origin.current;
          if (!o || o.done) return;
          end(Date.now() - o.at < 300 ? "lock" : "release");
        }}
        onPointerCancel={() => origin.current && !origin.current.done && end("cancel")}
      >
        <Mic className="size-5" />
      </button>
    </div>
  );
}
