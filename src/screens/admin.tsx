import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminFlags, adminResolveFlag, adminStats, adminUsers } from "@/lib/admin.functions";
import { Header, StatusBar } from "@/components/ui";
import { useWgoStore } from "@/lib/store";

type Tab = "stats" | "users" | "moderation";
async function token() { return (await supabase.auth.getSession()).data.session?.access_token ?? ""; }

export function AdminScreen() {
  const pop = useWgoStore((s) => s.pop);
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof adminUsers>>>([]);
  const [flags, setFlags] = useState<Awaited<ReturnType<typeof adminFlags>>>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const t = await token();
        if (tab === "stats") { const s = await adminStats({ data: { token: t } }); if (!off) setStats(s); }
        if (tab === "users") { const u = await adminUsers({ data: { token: t, q } }); if (!off) setUsers(u); }
        if (tab === "moderation") { const f = await adminFlags({ data: { token: t } }); if (!off) setFlags(f); }
        if (!off) setErr(null);
      } catch (e) { if (!off) setErr(e instanceof Error ? e.message : "Erreur"); }
    })();
    return () => { off = true; };
  }, [tab, q]);

  async function resolve(id: string, status: "dismissed" | "actioned") {
    await adminResolveFlag({ data: { token: await token(), id, status } });
    setFlags((f) => f.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  const card = "rounded-2xl bg-surface p-4 ring-1 ring-white/8";
  return (
    <div className="absolute inset-0 flex flex-col bg-bg">
      <StatusBar />
      <Header title="Admin" onBack={pop} />
      <div className="flex gap-2 px-4 pb-3">
        {([["stats", "Statistiques"], ["users", "Utilisateurs"], ["moderation", "Modération"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-10 flex-1 rounded-full text-[13px] font-medium ${tab === k ? "bg-accent text-accent-fg" : "bg-surface text-muted"}`}>{l}</button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pb-10">
        {err ? <p className="mb-3 text-[13px] text-danger">{err}</p> : null}
        {tab === "stats" && stats ? (
          <div className="grid grid-cols-2 gap-3">
            {[["Utilisateurs", stats.users], ["Nouveaux (7 j)", stats.users7], ["Messages", stats.messages], ["Messages (7 j)", stats.messages7], ["Conversations", stats.chats], ["Connexions", stats.connections], ["Signalements ouverts", stats.flags]].map(([l, v]) => (
              <div key={l as string} className={card}><div className="text-[24px] font-semibold">{v}</div><div className="text-[12px] text-muted">{l}</div></div>
            ))}
          </div>
        ) : null}
        {tab === "users" ? (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un @WIPP ou un nom" className="mb-3 h-11 w-full rounded-2xl bg-surface px-4 text-[14px] outline-none ring-1 ring-white/8" />
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className={`${card} flex items-center gap-3`}>
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="size-10 rounded-full object-cover" /> : <div className="size-10 rounded-full bg-white/10" />}
                  <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{u.display_name}</div><div className="truncate text-[12px] text-muted">@{u.username} · {new Date(u.created_at).toLocaleDateString("fr-CA")}</div></div>
                  {u.role === "admin" ? <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-fg">admin</span> : null}
                </div>
              ))}
            </div>
          </>
        ) : null}
        {tab === "moderation" ? (
          flags.length === 0 ? <p className="mt-8 text-center text-[13px] text-muted">Aucun signalement pour l'instant.</p> : (
            <div className="space-y-2">
              {flags.map((f) => (
                <div key={f.id} className={card}>
                  <div className="text-[14px] font-medium">{f.reason}</div>
                  <div className="text-[12px] text-muted">{f.target_type} · {new Date(f.created_at).toLocaleString("fr-CA")} · {f.status}</div>
                  {f.status === "open" ? (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => resolve(f.id, "dismissed")} className="h-9 flex-1 rounded-full bg-white/10 text-[13px]">Ignorer</button>
                      <button onClick={() => resolve(f.id, "actioned")} className="h-9 flex-1 rounded-full bg-danger text-[13px] text-white">Sanctionner</button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
