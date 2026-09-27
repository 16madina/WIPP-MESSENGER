import { useEffect, useReducer, useRef, useState } from "react";
import { Check, QrCode, ScanLine } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { WippMark, WippWordmark } from "@/components/logo";
import { Btn, Header, StatusBar } from "@/components/ui";
import { announce, haptic, reducedMotion } from "@/lib/haptics";
import { useT, useWgoStore } from "@/lib/store";
import { providers, type PublicCard, type TouchState } from "@/lib/providers";
import { initialTouch, touchReducer, TOUCH_REQUEST_TTL_MS } from "@/lib/touch-machine";
import type { MeProfile, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "reaching" | "contact" | "pick" | "offer" | "waiting" | "connected" | "failed";

/** Real BLE search window before QR/code fallback (same invite). */
const SEARCH_MS = 12_000;

function playConnectChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(784, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    /* silent / blocked */
  }
}

function MiniPhone({
  side,
  user,
  phase,
}: {
  side: "me" | "them";
  user?: User | MeProfile | null;
  phase: Phase;
}) {
  const showPeer = side === "them" && (phase === "waiting" || phase === "connected" || phase === "offer");
  return (
    <div className={cn("mini-phone", side === "me" ? "phone-me" : "phone-them")}>
      <span className="mini-island" />
      <div className="mini-phone-screen">
        {side === "me" ? (
          <>
            <Avatar user={user} size={40} />
            <WippWordmark className="mt-2 text-[13px] text-paper" />
          </>
        ) : showPeer && user ? (
          <>
            <Avatar user={user} size={40} />
            <p className="mt-2 text-[13px] font-semibold text-paper">
              {"firstName" in user && user.firstName
                ? user.firstName
                : "displayName" in user
                  ? String((user as { displayName?: string }).displayName ?? "")
                  : ""}
            </p>
          </>
        ) : (
          <span className="touch-radar" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        )}
      </div>
    </div>
  );
}

function Lockup({
  me,
  peer,
  done,
}: {
  me: MeProfile;
  peer?: User | null;
  done?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center justify-center gap-3 px-4 py-5">
      <div className="flex flex-col items-center">
        <Avatar user={me} size={56} />
        <p className="mt-1.5 text-[11px] font-semibold tracking-wide uppercase">{me.firstName}</p>
      </div>
      <div className="relative flex size-12 items-center justify-center">
        <WippMark size={done ? 36 : 44} invert />
        {done ? (
          <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-accent-fg">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col items-center">
        {peer ? <Avatar user={peer} size={56} /> : <span className="size-14 rounded-full bg-paper/10" />}
        <p className="mt-1.5 text-[11px] font-semibold tracking-wide uppercase">{peer?.firstName ?? "…"}</p>
      </div>
    </div>
  );
}


const CARD_USER = (c: PublicCard): User => ({
  id: c.id, firstName: c.displayName.split(" ")[0], lastName: "", displayName: c.displayName,
  username: c.username, bio: "", avatar: c.avatar ?? "", online: true, city: "", connected: false,
});

export function WgoTouchScreen() {
  const t = useT();
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const me = useWgoStore((s) => s.me);
  const users = useWgoStore((s) => s.users);
  const allowed = useWgoStore((s) => s.touchAllowed);
  const setTouchAllowed = useWgoStore((s) => s.setTouchAllowed);
  const completeTouch = useWgoStore((s) => s.completeTouch);
  const openOrCreateDm = useWgoStore((s) => s.openOrCreateDm);

  const [ctx, dispatch] = useReducer(touchReducer, initialTouch);
  const [contact, setContact] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const ttlRef = useRef<number | null>(null);
  const { state, peer, cards } = ctx;
  const peerUser = peer ? (users[peer.id] ?? CARD_USER(peer)) : null;

  const clear = () => {
    stopRef.current?.(); stopRef.current = null;
    if (ttlRef.current) window.clearTimeout(ttlRef.current);
    ttlRef.current = null;
  };
  useEffect(() => clear, []);

  useEffect(() => {
    if (state === "accepted" && peer) {
      useWgoStore.setState((st) => ({
        users: { ...st.users, [peer.id]: { ...(st.users[peer.id] ?? CARD_USER(peer)), connected: true } },
      }));
      completeTouch(peer.id);
      haptic("success"); playConnectChime(); announce(t("touchConnected"));
      clear();
    }
    if (state === "declined" || state === "expired" || state === "failed") { haptic("error"); clear(); }
    if (state === "detected" || state === "multiple_devices") haptic("connect");
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    clear();
    dispatch({ type: "START" });
    haptic("hold");
    setContact(false);
    if (!reducedMotion()) window.setTimeout(() => setContact(true), 720);
    // Jeton court et opaque — jamais numéro, e-mail ni identifiant permanent.
    const token = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
    stopRef.current = providers.proximity.start(token, (found) => dispatch({ type: "FOUND", cards: found }));
  }

  function connect() {
    dispatch({ type: "CONNECT" });
    // BACKEND : création de la demande (wipp_touch_invites) ; ici on passe en attente de réponse de B.
    window.setTimeout(() => dispatch({ type: "SENT" }), 500);
    ttlRef.current = window.setTimeout(() => dispatch({ type: "EXPIRED" }), TOUCH_REQUEST_TTL_MS);
  }

  if (!allowed) {
    return (
      <div className="flex h-full flex-col bg-navy text-paper">
        <StatusBar />
        <Header title={t("wgoTouch")} onBack={pop} className="text-paper [&_button]:text-paper" />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <WippMark size={72} invert />
          <h1 className="mt-6 max-w-[18ch] text-[22px] font-semibold leading-tight">{t("touchPermTitle")}</h1>
          <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-paper/65">{t("touchPermBody")}</p>
          <Btn className="mt-8 w-full" onClick={() => setTouchAllowed(true)}>{t("touchAllow")}</Btn>
          <Btn variant="ghost" className="mt-2 w-full text-paper" onClick={pop}>{t("later")}</Btn>
        </div>
      </div>
    );
  }

  const visual: Phase =
    state === "ready" ? "idle" : state === "searching" ? (contact ? "contact" : "reaching")
      : state === "detected" || state === "confirming" ? "offer"
      : state === "request_sent" ? "waiting" : state === "accepted" ? "connected" : "failed";
  const showStage = state === "ready" || state === "searching" || state === "detected" || state === "confirming" || state === "request_sent";
  const animPhase = state === "ready" || state === "searching" ? visual : "reveal";

  const msg: Partial<Record<TouchState, string>> = {
    ready: "Rapprochez vos téléphones",
    searching: "Recherche d'un téléphone WIPP à proximité…",
    confirming: "Envoi de la demande…",
    request_sent: `Demande envoyée. En attente de ${peer?.displayName.split(" ")[0] ?? "la réponse"}…`,
    declined: "La demande a été refusée.",
    expired: "La demande a expiré.",
    failed: ctx.reason === "none" ? "Personne détectée" : "Détection impossible pour le moment.",
  };

  return (
    <div className="isolate flex h-full flex-col bg-navy text-paper" data-touch-state={state}>
      <StatusBar />
      <Header title={t("wgoTouch")} onBack={pop} className="text-paper [&_button]:text-paper" />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
        <div className="touch-glow" data-phase={animPhase} />

        {showStage ? (
          <button type="button" className="touch-stage" data-phase={animPhase} aria-label={t("touchHold")}
            onClick={() => (state === "ready" ? start() : undefined)}>
            <MiniPhone side="me" user={me} phase={visual} />
            <div className="touch-spark" aria-hidden>
              <span className="touch-flash" />
              <svg viewBox="0 0 64 64" className="touch-mark">
                <circle className="dot-l" cx="20" cy="32" r="5.5" fill="#F7F9FC" />
                <circle className="dot-r" cx="44" cy="32" r="5.5" fill="#FFD84D" />
                <path className="smile" d="M20 32c2.4 0 3.6 8 12 8s9.6-8 12-8" stroke="#F7F9FC" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <MiniPhone side="them" user={peerUser} phase={visual} />
          </button>
        ) : state === "accepted" ? (
          <Lockup me={me} peer={peerUser} done />
        ) : state !== "multiple_devices" ? (
          <div className="flex justify-center px-4 py-8"><WippMark size={64} invert /></div>
        ) : null}

        {msg[state] ? (
          <p className={cn("px-8 text-center text-[14px] leading-relaxed text-paper/65", state === "failed" && "text-[17px] font-semibold text-paper")}>
            {msg[state]}
          </p>
        ) : null}
        {state === "ready" ? (
          <p className="mt-1 px-8 text-center text-[11px] text-paper/40">{t("touchVisible")}</p>
        ) : null}
        {state === "failed" ? (
          <p className="mt-2 px-8 text-center text-[13px] text-paper/50">Affiche ton QR ou scanne le sien.</p>
        ) : null}

        {state === "detected" && peer && peerUser ? (
          <div className="relative z-10 mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-paper/8 p-4 ring-1 ring-accent/35 rise">
            <Avatar user={peerUser} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold">{peer.displayName}</p>
              <p className="truncate text-[13px] text-paper/60">@{peer.username}</p>
            </div>
          </div>
        ) : null}

        {state === "multiple_devices" ? (
          <div className="mx-4 mt-2">
            <p className="mb-2 text-center text-[15px] font-semibold">Plusieurs personnes détectées</p>
            <p className="mb-3 text-center text-[13px] text-paper/55">Choisis la bonne personne.</p>
            <div className="grid gap-2">
              {cards.map((c) => {
                const u = users[c.id] ?? CARD_USER(c);
                return (
                  <button key={c.id} type="button" onClick={() => dispatch({ type: "PICK", card: c })}
                    className="flex min-h-14 items-center gap-3 rounded-2xl bg-paper/8 p-3 text-left ring-1 ring-paper/10 active:scale-[0.98]">
                    <Avatar user={u} size={44} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{c.displayName}</p>
                      <p className="truncate text-[12px] text-paper/55">@{c.username}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {state === "accepted" && peer ? (
          <div className="relative z-10 mx-4 mt-1 rounded-2xl bg-paper/8 px-5 py-5 text-center ring-1 ring-accent/35 rise">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-accent-fg">
              <Check className="size-5" strokeWidth={3} />
            </span>
            <p className="mt-3 text-[22px] font-semibold">Vous êtes connectés ✨</p>
            <p className="mt-1 text-[14px] leading-relaxed text-paper/70">{peer.displayName} {t("touchAdded")}</p>
          </div>
        ) : null}

        {import.meta.env.DEV ? (
          /* REMOVE BEFORE PRODUCTION — simulateur d'états Touch (le navigateur ne détecte aucun téléphone) */
          <details className="mx-5 mt-4 text-[12px] text-paper/45">
            <summary className="cursor-pointer py-2 text-center">Debug · simuler</summary>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["1 personne", () => dispatch({ type: "FOUND", cards: debugCards(users, 1) })],
                ["2 personnes", () => dispatch({ type: "FOUND", cards: debugCards(users, 2) })],
                ["B accepte", () => dispatch({ type: "ACCEPTED" })],
                ["B refuse", () => dispatch({ type: "DECLINED" })],
                ["Expire", () => dispatch({ type: "EXPIRED" })],
                ["Erreur", () => dispatch({ type: "FAIL", reason: "error" })],
              ].map(([l, f]) => (
                <button key={l as string} type="button" className="h-11 rounded-xl bg-paper/8" onClick={f as () => void}>{l as string}</button>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <div className="relative z-10 shrink-0 px-5 pb-8 pt-3">
        {state === "ready" ? (
          <>
            <Btn className="w-full" onClick={start}>{t("touchCta")}</Btn>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Btn variant="secondary" className="text-paper" onClick={() => push({ name: "scanner" })}>
                <ScanLine className="size-4" />{t("touchScanQr")}
              </Btn>
              <Btn variant="secondary" className="text-paper" onClick={() => push({ name: "my-qr" })}>
                <QrCode className="size-4" />{t("touchShowQr")}
              </Btn>
            </div>
          </>
        ) : null}
        {state === "detected" ? <Btn className="w-full" onClick={connect}>Se connecter</Btn> : null}
        {state === "accepted" && peer ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" className="text-paper" onClick={() => push({ name: "found-profile", userId: peer.id, via: "touch" })}>
              {t("viewProfile")}
            </Btn>
            <Btn onClick={() => openOrCreateDm(peer.id)}>{t("write")}</Btn>
          </div>
        ) : null}
        {state === "failed" || state === "declined" || state === "expired" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="secondary" className="text-paper" onClick={() => push({ name: "my-qr" })}>Afficher mon QR</Btn>
              <Btn variant="secondary" className="text-paper" onClick={() => push({ name: "scanner" })}>Scanner son QR</Btn>
            </div>
            <Btn className="mt-2 w-full" onClick={start}>Réessayer</Btn>
          </>
        ) : null}
        {state === "searching" || state === "detected" || state === "multiple_devices" || state === "request_sent" ? (
          <button type="button" className="mt-1 h-11 w-full text-[13px] text-paper/45" onClick={() => { clear(); dispatch({ type: "RESET" }); }}>
            {t("cancel")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function debugCards(users: Record<string, User>, n: number): PublicCard[] {
  return Object.values(users).slice(0, n).map((u) => ({ id: u.id, displayName: u.displayName, username: u.username, avatar: u.avatar }));
}
