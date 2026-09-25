import type { MessageState } from "@/components/native/MessageStatus";

/** Données factices — remplacées plus tard par le backend WiPP. */
export type Chat = { id: string; name: string; username: string; last: string; time: string; unread: number; online?: boolean | undefined; state?: MessageState | undefined; pinned?: boolean | undefined; muted?: boolean | undefined };
export type Message = { id: string; mine: boolean; text: string; time: string; state?: MessageState | undefined; reactions?: string[] | undefined; replyTo?: string | undefined; edited?: boolean | undefined; deleted?: boolean | undefined; pinned?: boolean | undefined };

export const chats: Chat[] = [
  { id: "1", name: "Aïcha", username: "aicha.d", last: "On se voit demain ?", time: "21:04", unread: 2, online: true },
  { id: "2", name: "Karim", username: "karim_b", last: "Parfait, merci !", time: "20:41", unread: 0, state: "read" },
  { id: "3", name: "Léa", username: "lea.m", last: "Photo", time: "19:12", unread: 0, state: "delivered", online: true },
  { id: "4", name: "Moussa", username: "moussa", last: "Je t'appelle ce soir", time: "Hier", unread: 1 },
  { id: "5", name: "Inès", username: "ines_r", last: "Ça marche 👍", time: "Hier", unread: 0, state: "sent" },
  { id: "6", name: "Yanis", username: "yanis", last: "Envoi en cours…", time: "Mar.", unread: 0, state: "sending" },
  { id: "7", name: "Sofia", username: "sofia.k", last: "Message non envoyé", time: "Lun.", unread: 0, state: "failed" },
  { id: "8", name: "Omar", username: "omar", last: "À plus", time: "Dim.", unread: 0, state: "read" },
];

export const messages: Message[] = [
  { id: "m1", mine: false, text: "Salut ! Tu es dispo demain ?", time: "20:58" },
  { id: "m2", mine: false, text: "J'aimerais te montrer le projet", time: "20:58" },
  { id: "m3", mine: true, text: "Oui, l'après-midi 🙂", time: "21:00", state: "read" },
  { id: "m4", mine: true, text: "Tu veux passer à quelle heure ?", time: "21:00", state: "read", reactions: ["👍"] },
  { id: "m5", mine: false, text: "Super, vers 15h ?", time: "21:02" },
  { id: "m6", mine: false, text: "Je ramène les croissants 🥐", time: "21:02", reactions: ["❤️"] },
  { id: "m7", mine: false, text: "Et on appelle Karim après", time: "21:02" },
  { id: "m8", mine: true, text: "Parfait pour moi", time: "21:03", state: "delivered" },
  { id: "m9", mine: false, text: "On se voit demain ?", time: "21:04" },
];

export const calls = [
  { id: "c1", name: "Karim", kind: "video", missed: false, time: "20:10" },
  { id: "c2", name: "Aïcha", kind: "audio", missed: true, time: "Hier" },
  { id: "c3", name: "Léa", kind: "audio", missed: false, time: "Mar." },
];

export type Story = { name: string; badge?: "add" | "call" | "video" };
export const stories: Story[] = [
  { name: "Votre story", badge: "add" },
  { name: "Samira" },
  { name: "Julien", badge: "call" },
  { name: "Maya", badge: "video" },
  { name: "Alex" },
  { name: "Inès" },
];

export type CallEntry = {
  id: string; name: string; type: "out" | "in" | "missed" | "video" | "group";
  time: string; video: boolean; locked?: boolean; presence?: "online" | "active" | "busy";
};
export const callLog: CallEntry[] = [
  { id: "a", name: "Alex", type: "out", time: "09:42", video: false, locked: true, presence: "online" },
  { id: "b", name: "Samira", type: "in", time: "08:17", video: false, presence: "online" },
  { id: "c", name: "Maya", type: "video", time: "Hier 19:24", video: true, presence: "active" },
  { id: "d", name: "Léa", type: "missed", time: "Hier 14:08", video: false, locked: true, presence: "busy" },
  { id: "e", name: "Thomas", type: "out", time: "mar. 18:36", video: false, presence: "online" },
  { id: "f", name: "Inès", type: "video", time: "mar. 12:14", video: true, presence: "online" },
  { id: "g", name: "Famille Diallo", type: "group", time: "dim. 20:31", video: false },
];
