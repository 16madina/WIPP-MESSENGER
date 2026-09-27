// Section « Demandes réelles » (backend) — séparée des demandes de démonstration.
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Btn } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useWgoStore } from "@/lib/store";
import {
  blockProfile, hasServerSession, listIncomingRequests, respondRequest, sendRequest,
  STATUS_FR, type RealRequest,
} from "@/lib/connections";

export function RealRequestsSection() {
  const push = useWgoStore((s) => s.push);
  const [live, setLive] = useState<boolean | null>(null);
  const [items, setItems] = useState<RealRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [handle, setHandle] = useState("");

  const load = useCallback(async () => {
    const ok = await hasServerSession();
    setLive(ok);
    if (ok) setItems(await listIncomingRequests());
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (!live) return null;

  const act = async (r: RealRequest, action: "accept" | "decline" | "ignore" | "block") => {
    setBusy(r.id);
    let msg: string;
    if (action === "block") {
      const ok = await blockProfile(r.sender.id);
      msg = ok ? `${r.sender.displayName} est bloqué` : "Blocage impossible";
    } else {
      const s = await respondRequest(r.id, action);
      msg = ({ accepted: "Vous êtes connectés ✨", declined: "Demande refusée", ignored: "Demande ignorée",
        already_handled: "Demande déjà traitée", expired: "Demande expirée", blocked: "Demande indisponible",
        not_found: "Demande introuvable" } as Record<string, string>)[s] ?? "Une erreur est survenue";
    }
    haptic(action === "accept" ? "success" : "select");
    setNote(msg);
    setBusy(null);
    void load();
  };

  const send = async () => {
    if (!handle.trim()) return;
    setBusy("send");
    const s = await sendRequest(handle.trim());
    setNote(STATUS_FR[s] ?? STATUS_FR.error);
    setBusy(null);
  };

  return (
    <section aria-label="Demandes réelles" className="mb-4">
      <div className="mb-3 flex gap-2">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@pseudo"
          aria-label="Pseudo à ajouter"
          className="min-h-11 flex-1 rounded-xl bg-surface px-3 text-[15px] hairline outline-none"
        />
        <Btn className="h-11 px-4 text-[13px]" disabled={busy === "send"} onClick={send}>Se connecter</Btn>
      </div>
      {note ? <p role="status" className="mb-3 text-center text-[13px] text-muted">{note}</p> : null}
      {items.map((r) => (
        <div key={r.id} className="mb-3 rounded-xl bg-surface p-4 hairline" data-testid="real-request">
          <button type="button" className="flex w-full gap-3 text-left"
            onClick={() => push({ name: "touch-incoming", requestId: r.id })}>
            <Avatar user={{ id: r.sender.id, displayName: r.sender.displayName, avatar: r.sender.avatarUrl ?? undefined } as never} size={48} />
            <div className="min-w-0">
              <p className="font-medium">{r.sender.displayName}</p>
              <p className="text-[13px] text-muted">@{r.sender.username}</p>
              <p className="mt-1 text-[13px] text-muted">veut se connecter avec toi</p>
            </div>
          </button>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <Btn className="h-10 px-1 text-[12px]" disabled={busy === r.id} onClick={() => act(r, "accept")}>Accepter</Btn>
            <Btn variant="secondary" className="h-10 px-1 text-[12px]" disabled={busy === r.id} onClick={() => act(r, "decline")}>Refuser</Btn>
            <Btn variant="secondary" className="h-10 px-1 text-[12px]" disabled={busy === r.id} onClick={() => act(r, "ignore")}>Ignorer</Btn>
            <Btn variant="danger" className="h-10 px-1 text-[12px]" disabled={busy === r.id} onClick={() => act(r, "block")}>Bloquer</Btn>
          </div>
        </div>
      ))}
      <p className="mb-2 mt-4 text-[12px] font-medium uppercase tracking-wide text-muted">Démonstration</p>
    </section>
  );
}
