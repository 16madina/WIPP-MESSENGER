import { useWgoStore } from "./store";
import { inviteSlug } from "./invite";
import { defaultGroupPerms, type Chat, type GroupPerms, type Message } from "./types";

/**
 * Groupes WIPP (démonstration locale). Toute la logique passe par le store existant :
 * sourdine, épingler, archiver, non lu, éphémères réutilisent les actions des lots 2/3.
 * Rien n'est envoyé au serveur ; le chiffrement de groupe réel reste à finaliser côté backend.
 */

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

export function perms(chat: Chat): GroupPerms {
  return { ...defaultGroupPerms, ...chat.groupPerms };
}

export function adminsOf(chat: Chat): string[] {
  return chat.adminIds ?? [chat.participantIds[0] ?? "me"];
}

export function isAdmin(chat: Chat, id = "me") {
  return adminsOf(chat).includes(id);
}

export function can(chat: Chat, what: "editInfo" | "send" | "addMembers", id = "me") {
  if (chat.type !== "group") return true;
  if (chat.left) return false;
  return perms(chat)[what] === "all" || isAdmin(chat, id);
}

export function nameOf(id: string) {
  const st = useWgoStore.getState();
  if (id === "me") return "Vous";
  return st.users[id]?.firstName || st.users[id]?.displayName || "Quelqu’un";
}

function patch(chatId: string, fn: (c: Chat) => Chat, sysText?: string) {
  useWgoStore.setState((st) => {
    const sys: Message | null = sysText
      ? {
          id: uid("sys"),
          chatId,
          fromId: "system",
          type: "system",
          text: sysText,
          createdAt: Date.now(),
          status: "read",
          reactions: [],
        }
      : null;
    return {
      chats: st.chats.map((c) =>
        c.id === chatId ? { ...fn(c), ...(sys ? { preview: sysText, lastAt: sys.createdAt } : {}) } : c,
      ),
      messages: sys ? { ...st.messages, [chatId]: [...(st.messages[chatId] ?? []), sys] } : st.messages,
    };
  });
}

export function createGroupFull(opts: { name: string; description?: string; avatar?: string; memberIds: string[] }) {
  const id = uid("g");
  const now = Date.now();
  const text = `Vous avez créé le groupe « ${opts.name} ».`;
  const chat: Chat = {
    id,
    type: "group",
    name: opts.name,
    description: opts.description?.trim() || undefined,
    avatar: opts.avatar,
    inviteToken: inviteSlug(opts.name),
    participantIds: ["me", ...opts.memberIds],
    adminIds: ["me"],
    groupPerms: { ...defaultGroupPerms },
    unread: 0,
    muted: false,
    pinned: false,
    archived: false,
    isRequest: false,
    preview: text,
    lastAt: now,
  };
  const sys: Message = { id: uid("sys"), chatId: id, fromId: "system", type: "system", text, createdAt: now, status: "read", reactions: [] };
  const added: Message = {
    ...sys,
    id: uid("sys"),
    createdAt: now + 1,
    text: `Vous avez ajouté ${opts.memberIds.map(nameOf).join(", ")}.`,
  };
  useWgoStore.setState((st) => ({
    chats: [chat, ...st.chats],
    messages: { ...st.messages, [id]: [sys, added] },
    stack: [{ name: "chats" }, { name: "conversation", chatId: id }],
  }));
  return id;
}

export function updateGroupInfo(chatId: string, next: { name?: string; description?: string; avatar?: string }) {
  if (next.avatar !== undefined) patch(chatId, (c) => ({ ...c, avatar: next.avatar }), "Vous avez modifié la photo du groupe.");
  if (next.name !== undefined && next.name.trim())
    patch(chatId, (c) => ({ ...c, name: next.name!.trim() }), `Vous avez renommé le groupe en « ${next.name.trim()} ».`);
  if (next.description !== undefined)
    patch(chatId, (c) => ({ ...c, description: next.description!.trim() || undefined }), "Vous avez modifié la description du groupe.");
}

export function addMembers(chatId: string, ids: string[]) {
  if (!ids.length) return;
  patch(
    chatId,
    (c) => ({ ...c, participantIds: [...c.participantIds, ...ids.filter((x) => !c.participantIds.includes(x))] }),
    `Vous avez ajouté ${ids.map(nameOf).join(", ")}.`,
  );
}

export function removeMember(chatId: string, id: string) {
  patch(
    chatId,
    (c) => ({ ...c, participantIds: c.participantIds.filter((x) => x !== id), adminIds: adminsOf(c).filter((x) => x !== id) }),
    `${nameOf(id)} a été retiré du groupe.`,
  );
}

export function setAdmin(chatId: string, id: string, on: boolean) {
  const chat = useWgoStore.getState().chats.find((c) => c.id === chatId);
  if (!chat) return;
  const admins = adminsOf(chat);
  // Le dernier admin ne peut pas perdre son rôle : le groupe garderait sinon zéro admin.
  if (!on && admins.length <= 1 && admins.includes(id)) return false;
  patch(
    chatId,
    (c) => ({ ...c, adminIds: on ? [...new Set([...adminsOf(c), id])] : adminsOf(c).filter((x) => x !== id) }),
    on ? `${nameOf(id)} est maintenant admin.` : `${nameOf(id)} n’est plus admin.`,
  );
  return true;
}

export function setGroupPerms(chatId: string, next: Partial<GroupPerms>) {
  patch(chatId, (c) => ({ ...c, groupPerms: { ...perms(c), ...next } }));
}

export function setNotifMode(chatId: string, mode: "all" | "mentions" | "none") {
  patch(chatId, (c) => ({ ...c, notifMode: mode }));
}

export function resetInvite(chatId: string) {
  const chat = useWgoStore.getState().chats.find((c) => c.id === chatId);
  if (!chat) return "";
  const token = `${inviteSlug(chat.name ?? "groupe")}-${Math.random().toString(36).slice(2, 6)}`;
  patch(chatId, (c) => ({ ...c, inviteToken: token }), "Le lien d’invitation a été réinitialisé. L’ancien lien ne fonctionne plus.");
  return token;
}

export function leaveGroup(chatId: string) {
  const chat = useWgoStore.getState().chats.find((c) => c.id === chatId);
  if (!chat) return;
  // Si je suis le seul admin, on nomme le plus ancien membre pour ne pas laisser le groupe sans contrôle.
  const admins = adminsOf(chat).filter((x) => x !== "me");
  const heir = admins.length ? null : chat.participantIds.find((x) => x !== "me");
  patch(
    chatId,
    (c) => ({
      ...c,
      left: true,
      participantIds: c.participantIds.filter((x) => x !== "me"),
      adminIds: heir ? [heir] : admins,
    }),
    heir ? `Vous avez quitté ce groupe. ${nameOf(heir)} est maintenant admin.` : "Vous avez quitté ce groupe.",
  );
}

/** Groupes de démonstration du lot 4 : ajoutés une seule fois, sans écraser les données locales. */
export function ensureGroupDemo() {
  const st = useWgoStore.getState();
  const h = (n: number) => Date.now() - n * 36e5;
  const m = (n: number) => Date.now() - n * 6e4;
  const mk = (id: string, chatId: string, fromId: string, text: string, at: number, extra: Partial<Message> = {}): Message => ({
    id, chatId, fromId, text, createdAt: at, type: "text", status: fromId === "me" ? "read" : "delivered", reactions: [], ...extra,
  });
  const chats = [...st.chats];
  const messages = { ...st.messages };
  let changed = false;

  const fam = chats.find((c) => c.id === "c-famille");
  if (fam && !fam.adminIds) {
    changed = true;
    Object.assign(fam, {
      participantIds: [...new Set([...fam.participantIds, "maya", "julien", "lea", "karim"])],
      adminIds: ["aisha", "me"],
      description: "Notre petit coin familial ❤️",
      groupPerms: { ...defaultGroupPerms },
      preview: "Aïcha : Dimanche on mange ensemble.",
    });
    const c = "c-famille";
    messages[c] = [
      mk("f-sys1", c, "system", "Aïcha a créé le groupe.", h(30), { type: "system" }),
      mk("f-sys2", c, "system", "Aïcha a ajouté Vous, Adama, Samira et Maya.", h(30) + 6e4, { type: "system" }),
      mk("f-sys3", c, "system", "Aïcha vous a nommé admin.", h(29), { type: "system" }),
      ...(messages[c] ?? []).filter((x) => !x.id.startsWith("f-")),
      mk("f-photo", c, "samira", "Le thieboudienne de maman 😍", h(3), {
        type: "image", imageUrl: "/media/food.jpg",
        reactions: [{ userId: "aisha", emoji: "❤️" }, { userId: "adama", emoji: "❤️" }, { userId: "me", emoji: "❤️" }, { userId: "maya", emoji: "😂" }],
      }),
      mk("f-voice", c, "adama", "Vocal", h(2), { type: "voice", audioUrl: "/music/afterglow.mp3", duration: 14 }),
      mk("f-mention", c, "maya", "@Vous tu peux ramener les boissons ?", m(40), { mentions: ["me"] }),
      mk("f-sys4", c, "system", "Les messages éphémères sont désactivés.", m(35), { type: "system" }),
    ].sort((a, b) => a.createdAt - b.createdAt);
  }

  if (!chats.some((c) => c.id === "c-equipe")) {
    changed = true;
    const c = "c-equipe";
    chats.unshift({
      id: c, type: "group", name: "Équipe WIPP", description: "Produit, design et lancement 🚀",
      avatar: "/brand/wipp-logo.jpg", inviteToken: "equipe-wipp",
      participantIds: ["me", "julien", "alex", "maya", "lea", "karim"], adminIds: ["julien", "maya", "me"],
      groupPerms: { ...defaultGroupPerms, editInfo: "admins", addMembers: "admins" },
      unread: 2, muted: false, pinned: false, archived: false, isRequest: false,
      preview: "Maya : J’arrive dans 10 min", lastAt: m(6),
    });
    messages[c] = [
      mk("e-sys1", c, "system", "Julien a créé le groupe.", h(48), { type: "system" }),
      mk("e-sys2", c, "system", "Julien a ajouté Alex.", h(48) + 6e4, { type: "system" }),
      mk("e-sys3", c, "system", "Maya est maintenant admin.", h(47), { type: "system" }),
      mk("e-sys4", c, "system", "La photo du groupe a été modifiée.", h(46), { type: "system" }),
      mk("e-1", c, "julien", "Voici le programme du lancement.", h(5), { pinned: true }),
      mk("e-doc", c, "julien", "", h(5) + 6e4, {
        type: "file", file: { name: "Programme-soiree.pdf", size: 2_516_582, mime: "application/pdf", url: "/demo/Programme-soiree.pdf" },
      }),
      mk("e-video", c, "alex", "Teaser v2", h(4), { type: "video", videoUrl: "/stickers/bravo.mp4", duration: 3 }),
      mk("e-2", c, "lea", "On se retrouve à 14 h ?", h(3), { reactions: [{ userId: "alex", emoji: "👍" }, { userId: "me", emoji: "👍" }] }),
      mk("e-3", c, "me", "Oui, salle B.", h(3) + 6e4, { replyTo: "e-2", replyPreview: "On se retrouve à 14 h ?" }),
      mk("e-4", c, "karim", "Rappel : démo client vendredi 10 h.", h(2), { pinned: true }),
      mk("e-sys5", c, "system", "Les messages éphémères sont réglés sur 7 jours.", h(1), { type: "system" }),
      mk("e-5", c, "maya", "J’arrive dans 10 min", m(6)),
    ];
  }
  if (changed) useWgoStore.setState({ chats, messages });
}
