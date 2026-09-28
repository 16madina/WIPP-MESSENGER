import { useEffect, useState } from "react";
import { Btn } from "@/components/ui";
import { useWgoStore } from "@/lib/store";
import type { NearbyMode } from "@/lib/types";

/** Visibilité effective (expire automatiquement). */
export function useNearbyVisibility() {
  const nearby = useWgoStore((s) => s.nearby);
  const until = useWgoStore((s) => s.nearbyUntil);
  const setNearby = useWgoStore((s) => s.setNearby);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (nearby <= 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [nearby]);
  const expired = nearby > 0 && until > 0 && until <= now;
  useEffect(() => { if (expired) setNearby(0); }, [expired, setNearby]);
  const visible = nearby !== 0 && !expired;
  const minutesLeft = nearby > 0 ? Math.max(1, Math.ceil((until - now) / 60_000)) : null;
  return { visible, minutesLeft, setNearby };
}

const DURATIONS: { mode: NearbyMode; label: string }[] = [
  { mode: 15, label: "15 minutes" },
  { mode: 60, label: "1 heure" },
  { mode: -1, label: "Jusqu'à désactivation" },
];

/** Carte en haut de « Personnes à proximité ». */
export function NearbyVisibilityCard() {
  const { visible, minutesLeft, setNearby } = useNearbyVisibility();
  const [choosing, setChoosing] = useState(false);

  if (visible) {
    return (
      <div className="mx-4 flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 py-2">
        <span className="size-2.5 rounded-full bg-accent" />
        <span className="flex-1 text-[13px] font-medium">
          Visible à proximité{minutesLeft ? ` · ${minutesLeft} min` : ""}
        </span>
        <button type="button" className="min-h-11 text-[13px] font-semibold text-muted" onClick={() => setNearby(0)}>
          Désactiver
        </button>
      </div>
    );
  }
  return (
    <div className="mx-4 rounded-2xl bg-surface p-4">
      <p className="text-[15px] font-semibold">Tu es invisible pour le moment</p>
      <p className="mt-0.5 text-[13px] text-muted">Les personnes autour de toi ne peuvent pas te découvrir.</p>
      {choosing ? (
        <>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Devenir visible : les utilisateurs WIPP proches voient ta photo, ton nom et ton @WIPP. Jamais ton numéro ni ta
            position exacte. Ils doivent t'envoyer une demande que tu acceptes ou non.
          </p>
          <div className="mt-3 grid gap-2">
            {DURATIONS.map((d) => (
              <Btn key={d.mode} variant="secondary" onClick={() => { setNearby(d.mode); setChoosing(false); }}>
                {d.label}
              </Btn>
            ))}
          </div>
        </>
      ) : (
        <Btn className="mt-3 w-full" onClick={() => setChoosing(true)}>Activer ma visibilité</Btn>
      )}
    </div>
  );
}
