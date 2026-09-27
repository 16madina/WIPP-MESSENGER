import { useState } from "react";
import { Users } from "lucide-react";
import { Btn, Header, StatusBar } from "@/components/ui";
import { useWgoStore } from "@/lib/store";
import { STATUS_FR, sendRequest } from "@/lib/connections";
import { GROUP_FR, groupInviteCall, type RemoteProfile } from "@/lib/qr-remote";

// Résultats de scan serveur gardés en mémoire uniquement (jamais dans l'URL ni le stockage).
type Handoff =
  | { kind: "profile"; profile: RemoteProfile; connected: boolean }
  | { kind: "group"; token: string; name: string; members: number; member: boolean };
const handoffs = new Map<string, Handoff>();
export function stashHandoff(h: Handoff): string {
  const key = crypto.randomUUID();
  handoffs.set(key, h);
  return key;
}

/** Profil public résolu par QR temporaire. Aucun ajout automatique : « Se connecter » = demande. */
export function QrProfileScreen({ handoffKey }: { handoffKey: string }) {
  const pop = useWgoStore((s) => s.pop);
  const h = handoffs.get(handoffKey);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!h || h.kind !== "profile") return <Gone onBack={pop} />;
  const p = h.profile;
  async function connect() {
    setBusy(true);
    try {
      setStatus(await sendRequestVia(p.username));
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Profil WIPP" onBack={pop} />
      <div className="flex flex-1 flex-col items-center px-6 pt-4">
        {p.avatarUrl ? (
          <img src={p.avatarUrl} alt="" className="size-28 rounded-full object-cover" />
        ) : (
          <span className="flex size-28 items-center justify-center rounded-full bg-navy text-[40px] font-semibold text-paper">
            {p.displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <h1 className="mt-4 text-[24px] font-semibold">{p.displayName}</h1>
        <p className="text-[15px] text-muted">@{p.username}</p>
        {p.bio ? <p className="mt-2 max-w-[32ch] text-center text-[14px]">{p.bio}</p> : null}
        <div className="mt-6 w-full">
          {h.connected || status === "already_connected" || status === "accepted_existing" ? (
            <p className="text-center text-[14px] text-muted">Vous êtes déjà connectés</p>
          ) : status && status !== "error" ? (
            <p className="text-center text-[14px] font-medium" role="status">{STATUS_FR[status] ?? status}</p>
          ) : (
            <Btn className="w-full" disabled={busy} onClick={() => void connect()}>
              {busy ? "Envoi…" : status === "error" ? "Réessayer" : "Se connecter"}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

async function sendRequestVia(username: string) {
  return sendRequest(username);
}

/** Invitation de groupe vérifiée par le serveur ; on ne rejoint qu'après action explicite. */
export function QrGroupScreen({ handoffKey }: { handoffKey: string }) {
  const pop = useWgoStore((s) => s.pop);
  const h = handoffs.get(handoffKey);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!h || h.kind !== "group") return <Gone onBack={pop} />;
  const g = h;
  async function join() {
    setBusy(true);
    try {
      const r = await groupInviteCall(g.token, true);
      setStatus(r.status);
      if (r.status === "joined" || r.status === "already_member") handoffs.delete(handoffKey);
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }
  const done = g.member || status === "joined" || status === "already_member";
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Invitation de groupe" onBack={pop} />
      <div className="flex flex-1 flex-col items-center px-6 pt-6">
        <span className="flex size-24 items-center justify-center rounded-full bg-navy text-paper">
          <Users className="size-10" />
        </span>
        <h1 className="mt-4 text-[22px] font-semibold">{g.name}</h1>
        <p className="text-[14px] text-muted">{g.members} membre{g.members > 1 ? "s" : ""}</p>
        <div className="mt-6 w-full">
          {done ? (
            <p className="text-center text-[14px] font-medium" role="status">
              {GROUP_FR[status ?? "already_member"]}
            </p>
          ) : (
            <>
              {status ? <p className="mb-2 text-center text-[13px] text-danger" role="alert">{GROUP_FR[status] ?? GROUP_FR.error}</p> : null}
              <Btn className="w-full" disabled={busy} onClick={() => void join()}>
                {busy ? "…" : "Rejoindre le groupe"}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Gone({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="QR" onBack={onBack} />
      <p className="pt-16 text-center text-[14px] text-muted">Scanne à nouveau le QR.</p>
    </div>
  );
}
