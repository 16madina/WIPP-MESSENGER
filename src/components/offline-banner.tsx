import { useEffect, useState } from "react";

/** Bandeau hors ligne / reconnexion : jamais de page blanche en cas de panne réseau. */
export function OfflineBanner() {
  const [state, setState] = useState<"online" | "offline" | "back">("online");
  useEffect(() => {
    let t = 0;
    const off = () => setState("offline");
    const on = () => {
      setState("back");
      t = window.setTimeout(() => setState("online"), 2200);
    };
    if (!navigator.onLine) off();
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
      window.clearTimeout(t);
    };
  }, []);
  if (state === "online") return null;
  return (
    <div
      role="status"
      className="pointer-events-auto absolute inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-50 flex items-center justify-between gap-3 rounded-2xl bg-ink/85 px-4 py-2.5 text-[13px] text-paper shadow-lg backdrop-blur-xl"
    >
      <span>{state === "offline" ? "Hors ligne — tes messages partiront dès le retour du réseau." : "Reconnecté ✓"}</span>
      {state === "offline" ? (
        <button type="button" className="min-h-11 shrink-0 font-semibold text-accent" onClick={() => navigator.onLine && setState("back")}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
