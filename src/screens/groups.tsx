import { useState } from "react";
import { Bell, Camera, ChevronRight, Image as ImageIcon, LogOut, Search, Shield, Trash2, UserPlus, X } from "lucide-react";
import { Avatar, GroupAvatar } from "@/components/avatar";
import { GallerySheet } from "@/components/gallery";
import { Btn, Field, Header, SearchField, Sheet, StatusBar } from "@/components/ui";
import { ReportSheet, SafetyRow } from "@/components/safety";
import { groupInviteHref, groupInviteLabel } from "@/lib/invite";
import {
  addMembers, adminsOf, can, createGroupFull, isAdmin, leaveGroup, perms, removeMember,
  resetInvite, setAdmin, setGroupPerms, setNotifMode, updateGroupInfo,
} from "@/lib/groups";
import { useWgoStore } from "@/lib/store";
import type { Chat, GroupAudience, User } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Sélecteur WIPP : recherche nom/@username, chips en haut, sélection multiple. */
function MemberPicker({ exclude = [], ids, setIds }: { exclude?: string[]; ids: string[]; setIds: (f: (p: string[]) => string[]) => void }) {
  const users = useWgoStore((s) => s.users);
  const [q, setQ] = useState("");
  const all = Object.values(users).filter((u) => u.connected && !exclude.includes(u.id));
  const ql = q.trim().toLowerCase().replace(/^@/, "");
  const list = all.filter((u) => !ql || u.displayName.toLowerCase().includes(ql) || u.username.toLowerCase().includes(ql));
  const toggle = (id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <>
      {ids.length ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {ids.map((id) => (
            <button key={id} type="button" onClick={() => toggle(id)} className="press flex shrink-0 items-center gap-1.5 rounded-full bg-surface py-1 pr-2 pl-1 ring-1 ring-hair">
              <Avatar user={users[id]} size={24} />
              <span className="text-[13px]">{users[id]?.firstName || users[id]?.displayName}</span>
              <X className="size-3.5 text-muted" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="px-4 pb-2">
        <SearchField placeholder="Rechercher un nom ou @username" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {list.map((u) => {
          const on = ids.includes(u.id);
          return (
            <button key={u.id} type="button" className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left" onClick={() => toggle(u.id)}>
              <Avatar user={u} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">{u.displayName}</span>
                <span className="block truncate text-[13px] text-muted">@{u.username}</span>
              </span>
              <span className={cn("flex size-6 items-center justify-center rounded-full ring-1 ring-hair", on && "bg-accent text-accent-fg ring-accent")}>{on ? "✓" : null}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function NewGroupFlow() {
  const pop = useWgoStore((s) => s.pop);
  const [step, setStep] = useState<1 | 2>(1);
  const [ids, setIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [pick, setPick] = useState(false);

  if (step === 1)
    return (
      <div className="flex h-full flex-col">
        <StatusBar />
        <Header title="Nouveau groupe" onBack={pop} />
        <p className="px-5 pb-2 text-[13px] text-muted">{ids.length} {ids.length > 1 ? "personnes sélectionnées" : "personne sélectionnée"}</p>
        <MemberPicker ids={ids} setIds={setIds} />
        <div className="p-4 pb-8">
          <Btn className="w-full" disabled={!ids.length} onClick={() => setStep(2)}>Suivant</Btn>
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Configurer le groupe" onBack={() => setStep(1)} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4">
        <div className="flex flex-col items-center pb-4">
          <button type="button" className="relative" onClick={() => setPick(true)} aria-label="Photo du groupe">
            {photo ? <img src={photo} alt="" className="size-24 rounded-full object-cover" /> : (
              <span className="flex size-24 items-center justify-center rounded-full bg-surface ring-1 ring-hair"><Camera className="size-8 text-muted" /></span>
            )}
          </button>
          <span className="mt-2 text-[13px] font-medium text-accent">Photo du groupe</span>
        </div>
        <Field label="Nom du groupe" placeholder="Famille Diallo" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <div className="h-3" />
        <Field label="Description (facultatif)" placeholder="Notre petit coin familial ❤️" value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} />
        <p className="mt-4 text-[12px] text-muted">{ids.length + 1} participants · vous serez admin.</p>
      </div>
      <div className="p-4 pb-8">
        <Btn className="w-full" disabled={!name.trim()} onClick={() => createGroupFull({ name: name.trim(), description: desc, avatar: photo, memberIds: ids })}>
          Créer le groupe
        </Btn>
      </div>
      <GallerySheet open={pick} onClose={() => setPick(false)} onPick={setPhoto} title="Photo du groupe" />
    </div>
  );
}

function Choice({ label, value, onChange, disabled }: { label: string; value: GroupAudience; onChange: (v: GroupAudience) => void; disabled?: boolean }) {
  return (
    <div className="px-4 py-2.5">
      <p className="mb-1.5 text-[14px]">{label}</p>
      <div className="flex gap-2">
        {(["all", "admins"] as const).map((v) => (
          <button key={v} type="button" disabled={disabled} onClick={() => onChange(v)}
            className={cn("press min-h-10 flex-1 rounded-full text-[13px] ring-1 ring-hair", value === v ? "bg-accent font-semibold text-accent-fg" : "bg-surface")}>
            {v === "all" ? "Tous les membres" : "Admins uniquement"}
          </button>
        ))}
      </div>
    </div>
  );
}

function RowBtn({ icon, label, onClick, danger, hint }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; hint?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("press flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px]", danger && "text-danger")}>
      {icon}
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-[13px] text-muted">{hint}</span> : null}
      {!danger ? <ChevronRight className="size-4 text-muted" /> : null}
    </button>
  );
}

export function GroupInfoFull({ chatId }: { chatId: string }) {
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const replace = useWgoStore((s) => s.replace);
  const chat = useWgoStore((s) => s.chats.find((c) => c.id === chatId));
  const users = useWgoStore((s) => s.users);
  const me = useWgoStore((s) => s.me);
  const setMute = useWgoStore((s) => s.setMute);
  const setDisappear = useWgoStore((s) => s.setDisappear);
  const deleteChat = useWgoStore((s) => s.deleteChat);
  const openOrCreateDm = useWgoStore((s) => s.openOrCreateDm);
  const [sheet, setSheet] = useState<null | "photo" | "edit" | "add" | "invite" | "notif" | "perms" | "leave" | "disappear" | { member: string } | { remove: string }>(null);
  const [addIds, setAddIds] = useState<string[]>([]);
  const [draft, setDraft] = useState({ name: "", desc: "" });
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState(false);
  if (!chat) return null;

  const admin = isAdmin(chat);
  const p = perms(chat);
  const members = chat.participantIds.map((id) => (id === "me" ? me : users[id])).filter(Boolean) as User[];
  const admins = adminsOf(chat);
  const href = groupInviteHref(chat.inviteToken ?? chat.id);
  const close = () => setSheet(null);
  const muteLabel = chat.muteAlways ? "Toujours" : chat.muted ? "Active" : "Non";
  const notifLabel = chat.notifMode === "mentions" ? "Mentions seulement" : chat.notifMode === "none" ? "Silencieuses" : "Toutes";
  const disappearLabel = !chat.disappearAfterMs ? "Désactivés" : chat.disappearAfterMs <= 86_400_000 ? "24 heures" : chat.disappearAfterMs <= 7 * 86_400_000 ? "7 jours" : "30 jours";
  const openSearch = () => {
    try { sessionStorage.setItem("wipp-open-find", chatId); } catch { /* ignore */ }
    replace({ name: "conversation", chatId });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(href); } catch { /* ignore */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  const memberSheet = sheet && typeof sheet === "object" && "member" in sheet ? sheet.member : null;
  const removeSheet = sheet && typeof sheet === "object" && "remove" in sheet ? sheet.remove : null;

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Infos du groupe" onBack={pop} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col items-center px-6 pt-2 pb-4 text-center">
          <button type="button" onClick={() => can(chat, "editInfo") && setSheet("photo")} aria-label="Photo du groupe">
            <GroupAvatar users={members.filter((u) => u.id !== me.id)} size={104} photo={chat.avatar} />
          </button>
          <p className="mt-3 text-[22px] font-semibold">{chat.name}</p>
          {chat.description ? <p className="mt-1 text-[14px] text-muted">{chat.description}</p> : null}
          <p className="mt-1 text-[13px] text-muted">Groupe · {members.length} participants</p>
          {can(chat, "editInfo") ? (
            <button type="button" className="mt-2 text-[13px] font-medium text-accent" onClick={() => { setDraft({ name: chat.name ?? "", desc: chat.description ?? "" }); setSheet("edit"); }}>
              Modifier le nom et la description
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pb-4">
          {[
            { icon: <ImageIcon className="size-5" />, label: "Médias", go: () => push({ name: "chat-info", chatId }) },
            { icon: <Search className="size-5" />, label: "Recherche", go: openSearch },
            { icon: <Bell className="size-5" />, label: "Notifications", go: () => setSheet("notif") },
            { icon: <UserPlus className="size-5" />, label: "Inviter", go: () => setSheet("invite") },
          ].map((a) => (
            <button key={a.label} type="button" onClick={a.go} className="press flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-surface text-[11.5px] ring-1 ring-hair">
              <span className="text-accent">{a.icon}</span>{a.label}
            </button>
          ))}
        </div>

        <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-surface ring-1 ring-hair">
          <RowBtn icon={<ImageIcon className="size-5 text-muted" />} label="Médias, liens et documents" onClick={() => push({ name: "chat-info", chatId })} />
          <RowBtn icon={<Bell className="size-5 text-muted" />} label="Notifications" hint={`${notifLabel} · sourdine ${muteLabel}`} onClick={() => setSheet("notif")} />
          <RowBtn icon={<span className="w-5 text-center">⏱</span>} label="Messages éphémères" hint={disappearLabel} onClick={() => (admin || p.editInfo === "all") && setSheet("disappear")} />
          {admin ? <RowBtn icon={<Shield className="size-5 text-muted" />} label="Paramètres du groupe" onClick={() => setSheet("perms")} /> : null}
        </div>

        <p className="px-5 pb-1 text-[12px] font-medium uppercase text-muted">Participants · {members.length}</p>
        {can(chat, "addMembers") ? (
          <button type="button" className="press flex min-h-12 w-full items-center gap-3 px-4 text-[15px] text-accent" onClick={() => { setAddIds([]); setSheet("add"); }}>
            <span className="flex size-11 items-center justify-center rounded-full bg-accent/15"><UserPlus className="size-5" /></span>
            Ajouter des participants
          </button>
        ) : null}
        {members.map((u) => {
          const id = u.id === me.id ? "me" : u.id;
          return (
            <button key={u.id} type="button" className="press flex min-h-14 w-full items-center gap-3 px-4 py-1.5 text-left" onClick={() => id !== "me" && setSheet({ member: id })}>
              <Avatar user={u} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{id === "me" ? "Vous" : u.displayName}</span>
                <span className="block truncate text-[13px] text-muted">@{u.username}</span>
              </span>
              {admins.includes(id) ? <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">Admin</span> : null}
            </button>
          );
        })}

        <div className="mx-4 mt-5 overflow-hidden rounded-2xl bg-surface ring-1 ring-hair">
          {chat.left ? (
            <RowBtn danger icon={<Trash2 className="size-5" />} label="Supprimer le groupe de mes chats" onClick={() => { deleteChat(chatId); useWgoStore.setState({ stack: [{ name: "chats" }] }); }} />
          ) : (
            <RowBtn danger icon={<LogOut className="size-5" />} label="Quitter le groupe" onClick={() => setSheet("leave")} />
          )}
        </div>
        <div className="mt-3 px-2"><SafetyRow onReport={() => setReport(true)} /></div>
      </div>

      <GallerySheet open={sheet === "photo"} onClose={close} onPick={(url) => updateGroupInfo(chatId, { avatar: url })} title="Photo du groupe" />

      <Sheet open={sheet === "edit"} onClose={close} title="Infos du groupe">
        <Field label="Nom du groupe" value={draft.name} maxLength={60} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
        <div className="h-3" />
        <Field label="Description" value={draft.desc} maxLength={200} onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))} />
        <Btn className="mt-4 w-full" disabled={!draft.name.trim()} onClick={() => {
          if (draft.name.trim() !== chat.name) updateGroupInfo(chatId, { name: draft.name });
          if (draft.desc.trim() !== (chat.description ?? "")) updateGroupInfo(chatId, { description: draft.desc });
          close();
        }}>Enregistrer</Btn>
      </Sheet>

      <Sheet open={sheet === "add"} onClose={close} title="Ajouter des participants">
        <div className="flex h-[55vh] flex-col">
          <MemberPicker exclude={chat.participantIds} ids={addIds} setIds={setAddIds} />
          <Btn className="mt-3 w-full" disabled={!addIds.length} onClick={() => { addMembers(chatId, addIds); close(); }}>
            Ajouter {addIds.length || ""}
          </Btn>
        </div>
      </Sheet>

      <Sheet open={sheet === "invite"} onClose={close} title="Inviter via WIPP">
        <p className="mb-3 break-all text-center text-[13px] text-muted">{groupInviteLabel(chat.inviteToken ?? chat.id)}</p>
        <div className="flex flex-col gap-2">
          <Btn onClick={() => { void (navigator.share ? navigator.share({ title: chat.name, url: href }).catch(() => undefined) : copy()); }}>Partager le lien</Btn>
          <Btn variant="secondary" onClick={() => { close(); push({ name: "group-qr", chatId }); }}>QR du groupe</Btn>
          <Btn variant="secondary" onClick={() => void copy()}>{copied ? "Lien copié" : "Copier le lien"}</Btn>
          {admin ? <Btn variant="ghost" className="text-danger" onClick={() => resetInvite(chatId)}>Réinitialiser le lien</Btn> : null}
        </div>
      </Sheet>

      <Sheet open={sheet === "notif"} onClose={close} title="Notifications">
        <div className="flex flex-col gap-2">
          {(["all", "mentions", "none"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setNotifMode(chatId, m)} className={cn("press min-h-11 rounded-xl px-4 text-left text-[15px] ring-1 ring-hair", (chat.notifMode ?? "all") === m ? "bg-accent/15 font-semibold" : "bg-surface")}>
              {m === "all" ? "Toutes" : m === "mentions" ? "Mentions seulement" : "Silencieuses"}
            </button>
          ))}
        </div>
        <p className="mt-4 mb-2 text-[13px] font-medium text-muted">Mettre en sourdine</p>
        <div className="grid grid-cols-2 gap-2">
          {([["1h", "1 heure"], ["8h", "8 heures"], ["1w", "1 semaine"], ["always", "Toujours"]] as const).map(([k, l]) => (
            <Btn key={k} variant="secondary" onClick={() => { setMute(chatId, k); close(); }}>{l}</Btn>
          ))}
        </div>
        {chat.muted ? <Btn variant="ghost" className="mt-2 w-full" onClick={() => { setMute(chatId, "off"); close(); }}>Réactiver le son</Btn> : null}
      </Sheet>

      <Sheet open={sheet === "disappear"} onClose={close} title="Messages éphémères">
        <div className="flex flex-col gap-2">
          {([[0, "Désactivés"], [86_400_000, "24 heures"], [7 * 86_400_000, "7 jours"], [30 * 86_400_000, "30 jours"]] as const).map(([ms, l]) => (
            <button key={l} type="button" onClick={() => { setDisappear(chatId, ms); close(); }} className={cn("press min-h-11 rounded-xl px-4 text-left text-[15px] ring-1 ring-hair", (chat.disappearAfterMs ?? 0) === ms ? "bg-accent/15 font-semibold" : "bg-surface")}>{l}</button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === "perms"} onClose={close} title="Paramètres du groupe">
        <Choice label="Qui peut modifier les informations du groupe ?" value={p.editInfo} onChange={(v) => setGroupPerms(chatId, { editInfo: v })} />
        <Choice label="Qui peut envoyer des messages ?" value={p.send} onChange={(v) => setGroupPerms(chatId, { send: v })} />
        <Choice label="Qui peut ajouter des membres ?" value={p.addMembers} onChange={(v) => setGroupPerms(chatId, { addMembers: v })} />
        <label className="flex min-h-12 items-center justify-between px-4 text-[14px]">
          Autoriser @toutlemonde (admins)
          <input type="checkbox" checked={p.everyone} onChange={(e) => setGroupPerms(chatId, { everyone: e.target.checked })} className="size-5 accent-[var(--color-accent)]" />
        </label>
      </Sheet>

      <Sheet open={sheet === "leave"} onClose={close} title="Quitter le groupe ?">
        <p className="mb-4 text-center text-[14px] text-muted">L’historique reste visible, mais vous ne pourrez plus écrire dans « {chat.name} ».</p>
        <Btn className="w-full bg-danger text-paper" onClick={() => { leaveGroup(chatId); close(); }}>Quitter le groupe</Btn>
      </Sheet>

      <Sheet open={Boolean(memberSheet)} onClose={close} title={memberSheet ? users[memberSheet]?.displayName : ""}>
        {memberSheet ? (
          <div className="flex flex-col gap-2">
            <Btn variant="secondary" onClick={() => { close(); push({ name: "found-profile", userId: memberSheet }); }}>Voir le profil</Btn>
            <Btn variant="secondary" onClick={() => { close(); const id = openOrCreateDm(memberSheet); replace({ name: "conversation", chatId: id }); }}>Écrire en privé</Btn>
            {admin ? (
              admins.includes(memberSheet)
                ? <Btn variant="secondary" onClick={() => { setAdmin(chatId, memberSheet, false); close(); }}>Retirer le rôle admin</Btn>
                : <Btn variant="secondary" onClick={() => { setAdmin(chatId, memberSheet, true); close(); }}>Nommer admin</Btn>
            ) : null}
            {admin ? <Btn variant="ghost" className="text-danger" onClick={() => setSheet({ remove: memberSheet })}>Retirer du groupe</Btn> : null}
          </div>
        ) : null}
      </Sheet>

      <Sheet open={Boolean(removeSheet)} onClose={close} title="Retirer du groupe ?">
        {removeSheet ? (
          <>
            <p className="mb-4 text-center text-[14px] text-muted">{users[removeSheet]?.displayName} ne recevra plus les messages de « {chat.name} ».</p>
            <Btn className="w-full bg-danger text-paper" onClick={() => { removeMember(chatId, removeSheet); close(); }}>Retirer</Btn>
          </>
        ) : null}
      </Sheet>

      <ReportSheet open={report} onClose={() => setReport(false)} kind="group" targetId={chatId} onSubmitted={pop} />
    </div>
  );
}

export type { Chat };
