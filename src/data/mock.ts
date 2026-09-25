import type { MessageState } from "@/components/native/MessageStatus";

/** Données factices — remplacées plus tard par le backend WiPP. */
export type Chat = { id: string; name: string; username: string; last: string; time: string; unread: number; online?: boolean; state?: MessageState };
export type Message = { id: string; mine: boolean; text: string; time: string; state?: MessageState };

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
  { id: "m2", mine: true, text: "Oui, l'après-midi 🙂", time: "21:00", state: "read" },
  { id: "m3", mine: false, text: "Super, vers 15h ?", time: "21:02" },
  { id: "m4", mine: true, text: "Parfait pour moi", time: "21:03", state: "delivered" },
  { id: "m5", mine: false, text: "On se voit demain ?", time: "21:04" },
];

export const calls = [
  { id: "c1", name: "Karim", kind: "video", missed: false, time: "20:10" },
  { id: "c2", name: "Aïcha", kind: "audio", missed: true, time: "Hier" },
  { id: "c3", name: "Léa", kind: "audio", missed: false, time: "Mar." },
];
