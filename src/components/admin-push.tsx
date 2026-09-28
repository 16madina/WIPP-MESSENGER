import { useEffect, useState } from "react";
import { adminPush, adminUsers } from "@/lib/admin.functions";

const PRESETS: { label: string; title: string; body: string }[] = [
  { label: "Mise à jour", title: "Nouvelle mise à jour WIPP ✨", body: "Une nouvelle version de WIPP est disponible avec des améliorations. Mets l'app à jour pour en profiter." },
  { label: "Modification", title: "Changement sur WIPP", body: "Nous avons modifié certaines fonctionnalités de WIPP. Découvre les nouveautés dans l'app." },
  { label: "Compte suspendu", title: "Compte suspendu", body: "Votre compte a été suspendu suite au non-respect des règles de WIPP." },
  { label: "Compte bloqué", title: "Compte bloqué", body: "Votre compte a été bloqué. Contactez le support WIPP pour plus d'informations." },
  { label: "Statut supprimé", title: "Statut supprimé", body: "Votre statut a été signalé, donc nous l'avons supprimé." },
  { label: "Vidéo inadéquate", title: "Contenu retiré", body: "Votre vidéo n'est pas adéquate et a été retirée de WIPP." },
  { label: "Événement signalé", title: "Événement signalé", body: "Votre événement a été signalé et est en cours de vérification par notre équipe." },
  { label: "Boutique non conforme", title: "Boutique signalée", body: "Votre boutique ne respecte pas les normes de WIPP. Merci de la mettre en conformité." },
];

type U = Awaited<ReturnType<typeof adminUsers>>[number];

export function AdminPush({ token }: { token: () => Promise<string> }) {
  const [target, setTarget] = useState<"all" | "one">("all");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<U[]>([]);
  const [who, setWho] = useState<U | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (target !== "one" || who) return;
    const s = q.replace(/^@/, "").trim();
    if (!s) { setHits([]); return; }
    const id = window.setTimeout(async () => {
      try { setHits((await adminUsers({ data: { token: await token(), q: s } })).slice(0, 8)); } catch { setHits([]); }
    }, 300);
    return () => window.clearTimeout(id);
  }, [q, target, who, token]);

  async function send() {
    if (target === "all" && !window.confirm("Envoyer cette notification à tous les utilisateurs WIPP ?")) return;
    setBusy(true); setMsg(null);
    try {
      const r = await adminPush({ data: { token: await token(), target, profileId: who?.id, title, body } });
      setMsg(!r.ok ? "Les notifications ne sont pas encore configurées sur le serveur."
        : r.devices === 0 ? "Aucun appareil n'a activé les notifications pour ce choix."
        : `Envoyée à ${r.sent} appareil${r.sent > 1 ? "s" : ""} sur ${r.devices}.`);
    } catch (e) { setMsg((e as Error).message || "Envoi impossible"); }
    setBusy(false);
  }

  const card = "rounded-2xl bg-surface p-4";
  const input = "w-full rounded-2xl bg-surface px-4 text-[14px] outline-none";
  const canSend = title.trim() && body.trim() && (target === "all" || who) && !busy;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([["all", "Tous les utilisateurs"], ["one", "Un utilisateur"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => { setTarget(k); setWho(null); }} className={`min-h-11 flex-1 rounded-full text-[13px] font-medium ${target === k ? "bg-accent text-accent-fg" : "bg-surface text-muted"}`}>{l}</button>
        ))}
      </div>

      {target === "one" ? (
        who ? (
          <div className={`${card} flex items-center gap-3`}>
            <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{who.display_name}</div><div className="text-[12px] text-muted">@{who.username}</div></div>
            <button onClick={() => { setWho(null); setQ(""); }} className="min-h-11 text-[13px] text-muted">Changer</button>
          </div>
        ) : (
          <div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="@pseudo" className={`${input} h-11`} />
            <div className="mt-2 space-y-1">
              {hits.map((u) => (
                <button key={u.id} onClick={() => setWho(u)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left">
                  <span className="text-[14px] font-medium">@{u.username}</span>
                  <span className="truncate text-[12px] text-muted">{u.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        )
      ) : null}

      <div>
        <p className="mb-2 text-[12px] font-medium text-muted">Messages prédéfinis</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => { setTitle(p.title); setBody(p.body); }} className="min-h-9 rounded-full bg-surface px-3 text-[12px]">{p.label}</button>
          ))}
        </div>
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Titre" className={`${input} h-11`} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={4} placeholder="Message" className={`${input} py-3`} />

      <button disabled={!canSend} onClick={() => void send()} className="min-h-12 w-full rounded-full bg-accent text-[15px] font-semibold text-accent-fg disabled:opacity-40">
        {busy ? "Envoi…" : target === "all" ? "Envoyer à tous" : "Envoyer"}
      </button>
      {msg ? <p className="text-center text-[13px] text-muted">{msg}</p> : null}
    </div>
  );
}
