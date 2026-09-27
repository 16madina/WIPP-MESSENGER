/**
 * Téléphone B : « [Nom] veut se connecter avec toi sur WIPP ».
 * DEMO : les données viennent des contacts factices (clairement étiquetées).
 * BACKEND : réception réelle via wipp_touch_invites + fonction serveur respondTouch.
 * NATIVE : réception quand WIPP est fermé (notification / BLE / NFC) — non simulée ici.
 */
import { useEffect, useState, type ReactNode } from "react";
import { getRequest, respondRequest, type RealRequest } from "@/lib/connections";
import { Check, Clock, ShieldOff, TriangleAlert, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { WippMark } from "@/components/logo";
import { Btn, Header, StatusBar } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useWgoStore } from "@/lib/store";
import type { TouchIncomingCase } from "@/lib/types";

type View = TouchIncomingCase | "accepted" | "declined";

export function TouchIncomingScreen({ demo = "pending" }: { demo?: TouchIncomingCase }) {
  const pop = useWgoStore((s) => s.pop);
  const users = useWgoStore((s) => s.users);
  const openOrCreateDm = useWgoStore((s) => s.openOrCreateDm);
  const completeTouch = useWgoStore((s) => s.completeTouch);
  const [view, setView] = useState<View>(demo);
  const sender = Object.values(users)[0];

  const accept = () => {
    if (!sender) return setView("error");
    useWgoStore.setState((st) => ({ users: { ...st.users, [sender.id]: { ...sender, connected: true } } }));
    completeTouch(sender.id);
    haptic("success");
    setView("accepted");
  };
  const decline = () => { haptic("select"); setView("declined"); };

  const info: Partial<Record<View, { icon: ReactNode; title: string; body: string }>> = {
    expired: { icon: <Clock className="size-6" />, title: "Demande expirée", body: "Cette demande n'est plus valable. Rapprochez à nouveau vos téléphones." },
    handled: { icon: <Check className="size-6" />, title: "Demande déjà traitée", body: "Tu as déjà répondu à cette demande." },
    blocked: { icon: <ShieldOff className="size-6" />, title: "Demande indisponible", body: "Tu ne peux pas recevoir de demande de cette personne." },
    error: { icon: <TriangleAlert className="size-6" />, title: "Une erreur est survenue", body: "Impossible d'ouvrir la demande. Réessaie dans un instant." },
    declined: { icon: <X className="size-6" />, title: "Demande refusée", body: "La personne ne sera pas prévenue du motif." },
  };
  const end = info[view];

  return (
    <div className="flex h-full flex-col bg-navy text-paper">
      <StatusBar />
      <Header title="WIPP Touch" onBack={pop} className="text-paper [&_button]:text-paper" />
      <p className="mx-auto rounded-full bg-paper/10 px-3 py-1 text-[11px] font-medium text-paper/60">Démonstration</p>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {view === "pending" && sender ? (
          <>
            <div className="relative">
              <Avatar user={sender} size={96} />
              <span className="absolute -right-1 -bottom-1 rounded-full bg-navy p-1"><WippMark size={28} invert /></span>
            </div>
            <h1 className="mt-5 max-w-[20ch] text-[22px] font-semibold leading-tight">
              {sender.firstName} veut se connecter avec toi sur WIPP
            </h1>
            <p className="mt-2 text-[15px] font-medium">{sender.displayName}</p>
            <p className="text-[13px] text-paper/55">@{sender.username}</p>
          </>
        ) : view === "accepted" && sender ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg"><Check className="size-7" strokeWidth={3} /></span>
            <h1 className="mt-5 text-[22px] font-semibold">Vous êtes connectés ✨</h1>
            <p className="mt-2 text-[14px] text-paper/65">{sender.displayName} fait maintenant partie de tes contacts WIPP.</p>
          </>
        ) : end ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-paper/10">{end.icon}</span>
            <h1 className="mt-5 text-[20px] font-semibold">{end.title}</h1>
            <p className="mt-2 max-w-[32ch] text-[14px] leading-relaxed text-paper/65">{end.body}</p>
          </>
        ) : null}
      </div>
      <div className="shrink-0 px-5 pb-8 pt-3">
        {view === "pending" ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" className="text-paper" onClick={decline}>Refuser</Btn>
            <Btn onClick={accept}>Accepter</Btn>
          </div>
        ) : view === "accepted" && sender ? (
          <Btn className="w-full" onClick={() => openOrCreateDm(sender.id)}>Écrire</Btn>
        ) : view === "error" ? (
          <Btn className="w-full" onClick={() => setView("pending")}>Réessayer</Btn>
        ) : (
          <Btn variant="secondary" className="w-full text-paper" onClick={pop}>Fermer</Btn>
        )}
      </div>
    </div>
  );
}

/** Téléphone B relié à une VRAIE demande backend (wipp_connection_requests). */
export function RealIncomingScreen({ requestId }: { requestId: string }) {
  const pop = useWgoStore((s) => s.pop);
  const [req, setReq] = useState<RealRequest | null>(null);
  const [view, setView] = useState<View | "loading">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getRequest(requestId).then((r) => {
      if (r === "not_found") return setView("blocked");
      setReq(r);
      if (r.status !== "pending") setView(r.status === "expired" ? "expired" : "handled");
      else if (new Date(r.expiresAt) <= new Date()) setView("expired");
      else setView("pending");
    }).catch(() => setView("error"));
  }, [requestId]);

  const respond = async (action: "accept" | "decline") => {
    setBusy(true);
    const s = await respondRequest(requestId, action).catch(() => "error");
    setBusy(false);
    const map: Record<string, View> = { accepted: "accepted", declined: "declined", already_handled: "handled", expired: "expired", blocked: "blocked", not_found: "blocked" };
    setView(map[s] ?? "error");
    haptic(s === "accepted" ? "success" : "select");
  };

  const info: Partial<Record<View, { icon: ReactNode; title: string; body: string }>> = {
    expired: { icon: <Clock className="size-6" />, title: "Demande expirée", body: "Cette demande n'est plus valable." },
    handled: { icon: <Check className="size-6" />, title: "Demande déjà traitée", body: "Tu as déjà répondu à cette demande." },
    blocked: { icon: <ShieldOff className="size-6" />, title: "Demande indisponible", body: "Tu ne peux pas recevoir de demande de cette personne." },
    error: { icon: <TriangleAlert className="size-6" />, title: "Une erreur est survenue", body: "Impossible de traiter la demande. Réessaie dans un instant." },
    declined: { icon: <X className="size-6" />, title: "Demande refusée", body: "La personne ne sera pas prévenue du motif." },
  };
  const end = view !== "loading" ? info[view] : undefined;
  const u = req ? { displayName: req.sender.displayName, avatar: req.sender.avatarUrl ?? undefined } : null;

  return (
    <div className="flex h-full flex-col bg-navy text-paper">
      <StatusBar />
      <Header title="Demande WIPP" onBack={pop} className="text-paper [&_button]:text-paper" />
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {view === "pending" && req ? (
          <>
            <div className="relative">
              <Avatar user={u as never} size={96} />
              <span className="absolute -right-1 -bottom-1 rounded-full bg-navy p-1"><WippMark size={28} invert /></span>
            </div>
            <h1 className="mt-5 max-w-[22ch] text-[22px] font-semibold leading-tight">
              {req.sender.username} veut se connecter avec toi sur WIPP
            </h1>
            <p className="mt-2 text-[15px] font-medium">{req.sender.displayName}</p>
            <p className="text-[13px] text-paper/55">@{req.sender.username}</p>
          </>
        ) : view === "accepted" && req ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg"><Check className="size-7" strokeWidth={3} /></span>
            <h1 className="mt-5 text-[22px] font-semibold">Vous êtes connectés ✨</h1>
            <p className="mt-2 text-[14px] text-paper/65">{req.sender.displayName} fait maintenant partie de tes contacts WIPP.</p>
          </>
        ) : end ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-paper/10">{end.icon}</span>
            <h1 className="mt-5 text-[20px] font-semibold">{end.title}</h1>
            <p className="mt-2 max-w-[32ch] text-[14px] leading-relaxed text-paper/65">{end.body}</p>
          </>
        ) : null}
      </div>
      <div className="shrink-0 px-5 pb-8 pt-3">
        {view === "pending" ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" className="text-paper" disabled={busy} onClick={() => respond("decline")}>Refuser</Btn>
            <Btn disabled={busy} onClick={() => respond("accept")}>Accepter</Btn>
          </div>
        ) : view === "loading" ? null : (
          <Btn variant="secondary" className="w-full text-paper" onClick={pop}>Fermer</Btn>
        )}
      </div>
    </div>
  );
}
