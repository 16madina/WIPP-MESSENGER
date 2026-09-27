import { create } from "zustand";
import { useWgoStore } from "@/lib/store";
import type { CallLog, Message } from "@/lib/types";
import { SimulatedCallProvider } from "./simulated-provider";
import type { CallMedia, CallOutcome, CallParticipant, CallState, ProviderEvent } from "./types";

const IDLE: CallState = {
  status: "idle",
  media: "audio",
  dir: "out",
  group: false,
  participants: [],
  speakingId: null,
  muted: false,
  speaker: false,
  camOff: false,
  facing: "user",
  minimized: false,
  quality: "good",
  videoAsk: false,
  permission: null,
  micDenied: false,
  camDenied: false,
};

export const useCall = create<CallState>(() => ({ ...IDLE }));

const set = (p: Partial<CallState> | ((s: CallState) => Partial<CallState>)) => useCall.setState(p);
const get = () => useCall.getState();
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

let provider: SimulatedCallProvider | null = null;
let nextOutcome: CallOutcome = "answer";
let incomingTimer = 0;
let closeTimer = 0;
let permResolve: ((ok: boolean) => void) | null = null;

/* ---------------- Permissions (écran WIPP avant la demande système) ---------------- */

const PERM_KEY = { mic: "wipp.perm.mic", camera: "wipp.perm.camera" } as const;

async function ensurePermission(kind: "mic" | "camera"): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(PERM_KEY[kind]) === "granted") return true;
  set({ permission: { kind, stage: "ask" } });
  return new Promise<boolean>((resolve) => {
    permResolve = resolve;
  });
}

/** « Continuer » sur l'écran d'explication : vraie demande au navigateur, jamais simulée. */
async function confirmPermission() {
  const p = get().permission;
  if (!p) return;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
    const stream = await navigator.mediaDevices.getUserMedia(p.kind === "mic" ? { audio: true } : { video: true });
    stream.getTracks().forEach((t) => t.stop());
    localStorage.setItem(PERM_KEY[p.kind], "granted");
    set({ permission: null, ...(p.kind === "mic" ? { micDenied: false } : { camDenied: false }) });
    permResolve?.(true);
  } catch {
    set({ permission: { kind: p.kind, stage: "denied" } });
  }
}

/** Continuer sans l'autorisation refusée : le micro ou la caméra restent réellement indisponibles. */
function continueWithout() {
  const p = get().permission;
  if (!p) return;
  set({ permission: null, ...(p.kind === "mic" ? { micDenied: true, muted: true } : { camDenied: true, camOff: true }) });
  permResolve?.(true);
}

function cancelPermission() {
  set({ permission: null });
  permResolve?.(false);
}

/* ---------------- Événements du fournisseur ---------------- */

function patchPart(id: string, patch: Partial<CallParticipant>) {
  set((s) => {
    const exists = s.participants.some((p) => p.id === id);
    const participants = exists
      ? s.participants.map((p) => (p.id === id ? { ...p, ...patch } : p))
      : [...s.participants, { id, state: "invited" as const, muted: false, camOff: false, ...patch }];
    return { participants };
  });
}

function onEvent(e: ProviderEvent) {
  const s = get();
  if (s.status === "idle") return;
  switch (e.type) {
    case "ringing":
      if (s.status === "outgoing") set({ status: "ringing" });
      break;
    case "connecting":
      set({ status: "connecting" });
      break;
    case "connected":
      set({ status: "connected", connectedAt: s.connectedAt ?? Date.now() });
      break;
    case "outcome":
      finish(e.outcome === "declined" ? "declined" : e.outcome === "busy" ? "busy" : e.outcome === "noAnswer" ? "missed" : "failed", e.outcome);
      break;
    case "participant":
      patchPart(e.id, e.patch);
      break;
    case "speaking":
      set({ speakingId: e.id });
      break;
    case "quality":
      set({ quality: e.quality });
      break;
    case "reconnecting":
      set({ status: "reconnecting", speakingId: null });
      break;
    case "reconnected":
      set({ status: "connected", quality: "good" });
      break;
    case "lost":
      set({ endReason: "lost" });
      finish("failed", "failed");
      break;
  }
}

/* ---------------- Historique et conversation ---------------- */

function dmChatId(userId: string) {
  return useWgoStore
    .getState()
    .chats.find((c) => c.type === "dm" && c.participantIds.includes(userId) && c.participantIds.includes("me"))?.id;
}

function record(opts: { missed: boolean; duration?: number; outcome?: CallLog["outcome"] }) {
  const s = get();
  const st = useWgoStore.getState();
  const peer = s.participants[0]?.id ?? "me";
  const entry: CallLog = {
    id: uid("call"),
    userId: peer,
    kind: s.media,
    direction: s.dir,
    missed: opts.missed,
    at: Date.now(),
    duration: opts.duration && opts.duration >= 1 ? Math.round(opts.duration) : undefined,
    group: s.group || undefined,
    chatId: s.chatId,
    participantIds: s.group ? s.participants.map((p) => p.id) : undefined,
    outcome: opts.outcome,
  };
  const chatId = s.chatId ?? dmChatId(peer);
  const ephemeral = st.privacy.ephemeralCalls === true;
  const label = opts.missed
    ? "Appel manqué"
    : `${s.group ? "Appel de groupe" : s.media === "video" ? "Appel vidéo" : "Appel audio"}`;
  const msg: Message | null = chatId
    ? {
        id: uid("callmsg"),
        chatId,
        fromId: "system",
        type: "system",
        text: label,
        createdAt: entry.at,
        status: "read",
        reactions: [],
        call: { media: s.media, missed: opts.missed, duration: entry.duration, dir: s.dir, group: s.group || undefined },
      }
    : null;
  useWgoStore.setState((cur) => ({
    calls: ephemeral ? cur.calls : [entry, ...cur.calls],
    messages: msg && chatId ? { ...cur.messages, [chatId]: [...(cur.messages[chatId] ?? []), msg] } : cur.messages,
    chats: msg ? cur.chats.map((c) => (c.id === chatId ? { ...c, preview: `📞 ${label}`, lastAt: entry.at } : c)) : cur.chats,
  }));
}

function finish(status: "ended" | "declined" | "missed" | "busy" | "failed", outcome?: CallOutcome | "ended") {
  const s = get();
  if (s.status === "idle" || s.status === "ended" || s.status === "declined" || s.status === "missed" || s.status === "busy" || s.status === "failed") return;
  provider?.dispose();
  provider = null;
  window.clearTimeout(incomingTimer);
  const duration = s.connectedAt ? (Date.now() - s.connectedAt) / 1000 : undefined;
  const wasConnected = Boolean(s.connectedAt);
  if (wasConnected) record({ missed: false, duration });
  else if (s.dir === "in") record({ missed: status === "missed" });
  else if (outcome && outcome !== "ended" && outcome !== "answer") record({ missed: false, outcome });
  set({ status, duration, minimized: false, speakingId: null, videoAsk: false });
  window.clearTimeout(closeTimer);
  // Écran de fin : bref si l'appel a eu lieu ; les échecs proposent Rappeler/Message/Fermer puis se ferment seuls.
  closeTimer = window.setTimeout(() => reset(), status === "ended" ? 2400 : 12000);
}

function reset() {
  window.clearTimeout(closeTimer);
  provider?.dispose();
  provider = null;
  useCall.setState({ ...IDLE }, true);
}

function busyElsewhere() {
  const s = get();
  return s.status !== "idle" && s.status !== "ended" && s.status !== "declined" && s.status !== "missed" && s.status !== "busy" && s.status !== "failed";
}

function callable(userId: string) {
  const st = useWgoStore.getState();
  return userId !== "me" && Boolean(st.users[userId]) && !st.blockedIds.includes(userId);
}

/* ---------------- API publique ---------------- */

export const callEngine = {
  /** Scénario de démo : issue du prochain appel sortant. */
  setNextOutcome(o: CallOutcome) {
    nextOutcome = o;
  },

  async start(opts: { targets: string[]; media: CallMedia; chatId?: string; group?: boolean; title?: string }) {
    if (busyElsewhere()) {
      set({ minimized: false });
      return;
    }
    const targets = opts.targets.filter(callable);
    if (!targets.length) return;
    reset();
    if (!(await ensurePermission("mic"))) return reset();
    if (opts.media === "video" && !get().camDenied && !(await ensurePermission("camera"))) return reset();
    const keep = get();
    const group = opts.group ?? targets.length > 1;
    set({
      ...IDLE,
      micDenied: keep.micDenied,
      camDenied: keep.camDenied,
      muted: keep.micDenied,
      camOff: keep.camDenied,
      status: "outgoing",
      media: opts.media,
      dir: "out",
      group,
      chatId: opts.chatId,
      title: opts.title,
      speaker: opts.media === "video",
      participants: targets.map((id) => ({ id, state: "ringing", muted: false, camOff: false })),
    });
    const outcome = nextOutcome;
    nextOutcome = "answer";
    provider = new SimulatedCallProvider(onEvent);
    provider.startOutgoing({ participantIds: targets, media: opts.media, outcome });
  },

  startGroup(chatId: string, media: CallMedia) {
    const chat = useWgoStore.getState().chats.find((c) => c.id === chatId);
    if (!chat || chat.left) return;
    return this.start({
      targets: chat.participantIds.filter((id) => id !== "me"),
      media,
      chatId,
      group: true,
      title: chat.name,
    });
  },

  simulateIncoming(userId: string, media: CallMedia, chatId?: string) {
    if (busyElsewhere() || !callable(userId)) return;
    if (useWgoStore.getState().privacy.calls === "nobody") return;
    const chat = chatId ? useWgoStore.getState().chats.find((c) => c.id === chatId) : undefined;
    const members = chat ? chat.participantIds.filter((id) => id !== "me") : [userId];
    reset();
    set({
      status: "ringing",
      dir: "in",
      media,
      group: Boolean(chat),
      chatId: chat?.id,
      title: chat?.name,
      speaker: media === "video",
      participants: members.map((id) => ({ id, state: id === userId ? "connected" : "ringing", muted: false, camOff: false })),
    });
    incomingTimer = window.setTimeout(() => finish("missed"), 25000);
  },

  async accept(withVideo: boolean) {
    const s = get();
    if (s.status !== "ringing" || s.dir !== "in") return;
    window.clearTimeout(incomingTimer);
    if (!(await ensurePermission("mic"))) return this.decline();
    const media: CallMedia = withVideo ? "video" : "audio";
    if (media === "video" && !(await ensurePermission("camera"))) return this.decline();
    set((cur) => ({ status: "connecting", media, muted: cur.micDenied, camOff: cur.camDenied }));
    provider = new SimulatedCallProvider(onEvent);
    provider.acceptIncoming(get().participants.map((p) => p.id));
  },

  decline(reply?: string) {
    const s = get();
    if (s.status !== "ringing" || s.dir !== "in") return;
    const peer = s.participants[0]?.id;
    window.clearTimeout(incomingTimer);
    record({ missed: true });
    if (reply && peer) {
      const chatId = s.chatId ?? dmChatId(peer);
      if (chatId) useWgoStore.getState().sendMessage(chatId, { type: "text", text: reply });
    }
    reset();
  },

  hangup() {
    const s = get();
    if (s.status === "idle") return;
    if (!busyElsewhere()) return reset();
    finish("ended", "ended");
  },

  close: reset,

  redial() {
    const s = get();
    const targets = s.participants.map((p) => p.id);
    const opts = { targets, media: s.media, chatId: s.chatId, group: s.group, title: s.title };
    reset();
    void this.start(opts);
  },

  /** Ouvre la conversation liée (bouton « Message »). */
  openChat() {
    const s = get();
    const chatId = s.chatId ?? (s.participants[0] ? dmChatId(s.participants[0].id) : undefined);
    reset();
    if (chatId) useWgoStore.getState().push({ name: "conversation", chatId });
  },

  toggleMute() {
    const s = get();
    if (s.micDenied) return set({ permission: { kind: "mic", stage: "denied" } });
    set({ muted: !s.muted });
    provider?.setMuted(!s.muted);
  },
  toggleSpeaker() {
    set((s) => ({ speaker: !s.speaker }));
  },
  flipCamera() {
    set((s) => ({ facing: s.facing === "user" ? "environment" : "user" }));
  },
  async toggleCamera() {
    const s = get();
    if (s.media === "audio") return set({ videoAsk: true });
    if (s.camOff && s.camDenied) return set({ permission: { kind: "camera", stage: "denied" } });
    set({ camOff: !s.camOff });
    provider?.setCamera(s.camOff);
  },
  async confirmVideo(ok: boolean) {
    set({ videoAsk: false });
    if (!ok) return;
    if (!(await ensurePermission("camera"))) return;
    set((s) => ({ media: "video", speaker: true, camOff: s.camDenied }));
  },

  minimize() {
    if (busyElsewhere()) set({ minimized: true });
  },
  expand() {
    set({ minimized: false });
  },

  invite(userId: string) {
    const s = get();
    if (!provider || s.participants.some((p) => p.id === userId && p.state !== "left" && p.state !== "declined")) return;
    set({ group: true });
    provider.invite(userId);
  },

  /* Commandes de démonstration */
  simUnstable() {
    provider?.simulateUnstable();
  },
  simDrop(recover: boolean) {
    provider?.simulateDrop(recover);
  },
  simPeer(id: string, patch: { muted?: boolean; camOff?: boolean; left?: boolean }) {
    provider?.simulatePeer(id, patch);
  },

  permission: { confirm: confirmPermission, without: continueWithout, cancel: cancelPermission },
};

export type CallEngine = typeof callEngine;
