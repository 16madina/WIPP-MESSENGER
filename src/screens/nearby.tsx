import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Lock, MapPin, MessageCircle, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Header, StatusBar } from "@/components/ui";
import { Sheet } from "@/components/native/Sheet";
import { useNearbyVisibility } from "@/components/nearby-visibility";
import { providers } from "@/lib/providers";
import { useWgoStore } from "@/lib/store";
import type { NearbyMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReqState = "sent" | "accepted" | "declined";
const STEPS = ["Détection des utilisateurs visibles", "Filtrage des profils", "Préparation de la liste"];

/** + → Personnes à proximité. Distinct de WIPP Touch ; jamais de distance ni de numéro. */
export function NearbyScreen() {
  const pop = useWgoStore((s) => s.pop);
  const users = useWgoStore((s) => s.users);
  const blocked = useWgoStore((s) => s.blockedIds);
  const nearby = useWgoStore((s) => s.nearby);
  const connectWith = useWgoStore((s) => s.connectWith);
  const openOrCreateDm = useWgoStore((s) => s.openOrCreateDm);
  const { visible, minutesLeft, setNearby } = useNearbyVisibility();
  const [found, setFound] = useState<string[] | null>(null);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Record<string, ReqState>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Le scan démarre dès que l'utilisateur devient visible.
  useEffect(() => {
    if (!visible) { setFound(null); return; }
    if (found) return;
    setStep(0);
    const s = [1, 2, 3].map((n) => window.setTimeout(() => setStep(n), n * 1000));
    const stop = providers.nearbyDiscovery.scan((ids) => setFound(ids));
    return () => { stop(); s.forEach((t) => window.clearTimeout(t)); };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = (found ?? []).filter((id) => users[id] && !blocked.includes(id));
  const scanning = visible && found === null;

  function request(id: string) {
    const u = users[id];
    if (u?.connected || reqs[id] === "accepted") { openOrCreateDm(id); return; }
    if (reqs[id]) return;
    connectWith(id);
    setReqs((r) => ({ ...r, [id]: "sent" }));
    // Démo : réponse simulée de l'autre personne (le vrai serveur renverra accepté/refusé).
    timers.current.push(window.setTimeout(
      () => setReqs((r) => ({ ...r, [id]: id.length % 2 === 0 ? "declined" : "accepted" })),
      3500,
    ));
  }

  const chips: { mode: NearbyMode; label: string }[] = [
    { mode: 0, label: "Invisible" },
    { mode: 15, label: "Visible 15 min" },
    { mode: 60, label: "Visible 1 h" },
  ];

  return (
    <div className="flex h-full flex-col bg-navy text-paper">
      <StatusBar />
      <Header title="Personnes à proximité" onBack={pop} />
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-5 pb-10">
        {!found ? (
          <div className="flex gap-2 pt-1">
            {chips.map((c) => {
              const active = c.mode === 0 ? !visible : visible && nearby === c.mode;
              return (
                <button
                  key={c.mode}
                  type="button"
                  onClick={() => setNearby(c.mode)}
                  className={cn(
                    "press min-h-11 flex-1 rounded-full text-[14px] font-semibold ring-1",
                    active ? "bg-accent text-accent-fg ring-accent" : "ring-paper/20",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {!visible ? (
          <div className="flex flex-col items-center pt-8 text-center">
            <span className="relative flex size-36 items-center justify-center rounded-full bg-paper/5 ring-1 ring-paper/10">
              <span className="absolute inset-7 rounded-full ring-1 ring-accent/40" />
              <MapPin className="size-10 fill-accent text-navy" />
            </span>
            <h2 className="mt-6 text-[26px] leading-tight font-bold">Vous êtes invisible<br />pour le moment.</h2>
            <p className="mt-3 max-w-[30ch] text-[15px] text-paper/60">
              Les personnes autour de toi ne peuvent pas te découvrir sur WIPP.
            </p>
            <div className="mt-6 w-full space-y-4 rounded-2xl bg-paper/5 p-5 text-left text-[15px] text-paper/80">
              <p className="flex items-center gap-4"><Users className="size-6 shrink-0 text-accent" />Découvre des personnes WIPP près de toi.</p>
              <p className="flex items-center gap-4"><ShieldCheck className="size-6 shrink-0 text-accent" />Ta visibilité est contrôlée par toi.</p>
              <p className="flex items-center gap-4"><Lock className="size-6 shrink-0 text-accent" />Aucune distance exacte n'est affichée.</p>
            </div>
            <button
              type="button"
              onClick={() => setNearby(15)}
              className="press mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-[17px] font-semibold text-accent-fg"
            >
              <MapPin className="size-5" /> Activer ma visibilité
            </button>
          </div>
        ) : scanning ? (
          <div className="flex flex-col items-center pt-6 text-center">
            <Radar faces={["samira", "julien", "maya", "alex", "lea", "ines"].map((id) => users[id]).filter(Boolean)} />
            <h2 className="mt-4 text-[24px] leading-tight font-bold">Recherche des personnes<br />autour de toi…</h2>
            <p className="mt-2 text-[15px] text-paper/60">Cela peut prendre quelques secondes.</p>
            <div className="mt-6 w-full space-y-4 rounded-2xl bg-paper/5 p-5 text-left text-[15px]">
              <p className="flex items-center gap-3 font-semibold"><Loader2 className="size-5 animate-spin text-accent" />Recherche en cours…</p>
              {STEPS.map((s, i) => (
                <p key={s} className={cn("flex items-center gap-3 transition-opacity", step > i ? "text-paper/80" : "text-paper/30")}>
                  <span className={cn("flex size-6 items-center justify-center rounded-full", step > i ? "bg-accent text-accent-fg" : "ring-1 ring-paper/20")}>
                    {step > i ? <Check className="size-4" strokeWidth={3} /> : null}
                  </span>
                  {s}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-1 flex min-h-12 items-center gap-3 rounded-2xl bg-accent/15 px-4 py-2 ring-1 ring-accent/30">
              <span className="size-4 rounded-full ring-2 ring-accent" />
              <span className="flex-1 text-[14px] font-semibold text-accent">
                Tu es visible à proximité{minutesLeft ? ` · ${minutesLeft} min` : ""}
              </span>
              <button type="button" onClick={() => setNearby(0)} className="press min-h-9 rounded-full bg-accent px-4 text-[13px] font-semibold text-accent-fg">
                Désactiver
              </button>
            </div>
            <p className="pt-4 pb-1 text-[14px] text-paper/70">Les personnes suivantes sont visibles autour de toi.</p>
            {list.map((id) => {
              const u = users[id];
              return (
                <div key={id} className="flex items-center gap-3 border-b border-paper/10 py-3">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setPicked(id)}>
                    <Avatar user={u} size={60} />
                    <span className="min-w-0">
                      <span className="block truncate text-[17px] font-semibold">{u.displayName}</span>
                      <span className="block text-[14px] text-paper/60">@{u.username}</span>
                      <span className="flex items-center gap-1.5 text-[13px] text-paper/60"><span className="size-2.5 rounded-full bg-accent" />À proximité</span>
                    </span>
                  </button>
                  <ReqButton state={u.connected ? "accepted" : reqs[id]} onClick={() => request(id)} />
                </div>
              );
            })}
            {providers.nearbyDiscovery.kind === "simulated" ? (
              <p className="pt-4 text-center text-[11px] text-paper/40">Démo : détection réelle dans l'app mobile.</p>
            ) : null}
          </>
        )}
      </div>

      <Sheet open={!!picked} onClose={() => setPicked(null)}>
        {picked && users[picked] ? (
          <div className="relative flex flex-col items-center px-6 pb-8 pt-2">
            <button type="button" aria-label="Fermer" onClick={() => setPicked(null)} className="absolute top-0 right-4 flex size-11 items-center justify-center rounded-full ring-1 ring-wipp-fg/15">
              <X className="size-5" />
            </button>
            <Avatar user={users[picked]} size={120} />
            <h3 className="mt-3 text-[24px] font-bold">{users[picked].displayName}</h3>
            <p className="text-[15px] text-muted">@{users[picked].username}</p>
            <div className="mt-5 w-full space-y-3 text-[15px]">
              <p className="flex items-center gap-3"><MapPin className="size-5" />À proximité</p>
              <p className="flex items-center gap-3"><MessageCircle className="size-5" />Discute · Partage · Découvre</p>
              {users[picked].bio ? <p className="pt-1 text-muted">{users[picked].bio}</p> : null}
            </div>
            <div className="mt-6 w-full">
              <ReqButton big state={users[picked].connected ? "accepted" : reqs[picked]} onClick={() => request(picked)} />
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

function ReqButton({ state, onClick, big }: { state?: ReqState; onClick: () => void; big?: boolean }) {
  const label = state === "sent" ? "Demande envoyée" : state === "accepted" ? "Écrire" : state === "declined" ? "Refusée" : "Se connecter";
  return (
    <button
      type="button"
      disabled={state === "sent" || state === "declined"}
      onClick={onClick}
      className={cn(
        "press flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold",
        big ? "min-h-14 w-full text-[17px]" : "min-h-11 px-4 text-[14px]",
        !state || state === "accepted" ? "bg-accent text-accent-fg" : "bg-paper/10 text-muted",
      )}
    >
      {big && !state ? <UserPlus className="size-5" /> : null}
      {label}
    </button>
  );
}

function Radar({ faces }: { faces: { id: string }[] }) {
  const pos = [[8, 22], [78, 10], [2, 58], [86, 50], [30, 82], [66, 84]];
  return (
    <div className="relative size-64">
      <span className="absolute inset-10 rounded-full ring-1 ring-accent/30" />
      <span className="absolute inset-16 rounded-full ring-2 ring-accent/60" />
      <span className="absolute inset-10 animate-ping rounded-full bg-accent/10 motion-reduce:animate-none" />
      <span
        className="absolute inset-10 animate-spin rounded-full motion-reduce:animate-none"
        style={{ animationDuration: "2.4s", background: "conic-gradient(from 0deg, transparent 0 75%, color-mix(in oklab, var(--wipp-accent, gold) 45%, transparent))" }}
      />
      <MapPin className="absolute top-1/2 left-1/2 size-10 -translate-1/2 fill-accent text-navy" />
      {faces.slice(0, 6).map((u, i) => (
        <span key={u.id} className="absolute animate-fade-in" style={{ left: `${pos[i][0]}%`, top: `${pos[i][1]}%`, animationDelay: `${i * 400}ms`, animationFillMode: "both" }}>
          <Avatar user={u as never} size={48} />
        </span>
      ))}
    </div>
  );
}
