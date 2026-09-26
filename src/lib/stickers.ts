import wippeMoi from "@/assets/stickers/elle/wippe-moi.png.asset.json";
import caWipp from "@/assets/stickers/elle/ca-wipp.png.asset.json";
import merci from "@/assets/stickers/elle/merci.png.asset.json";
import onSeCapte from "@/assets/stickers/elle/on-se-capte.png.asset.json";
import mdr from "@/assets/stickers/elle/mdr.png.asset.json";
import hmm from "@/assets/stickers/elle/hmm.png.asset.json";
import noWay from "@/assets/stickers/elle/no-way.png.asset.json";
import valide from "@/assets/stickers/elle/valide.png.asset.json";
import jArrive from "@/assets/stickers/elle/j-arrive.png.asset.json";
import bonneNuit from "@/assets/stickers/elle/bonne-nuit.png.asset.json";
import bonMatin from "@/assets/stickers/elle/bon-matin.png.asset.json";
import appelleMoi from "@/assets/stickers/elle/appelle-moi.png.asset.json";
import bisous from "@/assets/stickers/elle/bisous.png.asset.json";
import bravo from "@/assets/stickers/elle/bravo.png.asset.json";
import laisseTomber from "@/assets/stickers/elle/laisse-tomber.png.asset.json";
import connecte from "@/assets/stickers/elle/connecte.png.asset.json";

export const elleStickers = [
  { id: "wippe-moi", label: "Wippe-moi !", image: wippeMoi.url, motion: "wink", accent: "✦" },
  { id: "ca-wipp", label: "Ça WIPP !", image: caWipp.url, motion: "bounce", accent: "✦" },
  { id: "merci", label: "Merci 💛", image: merci.url, motion: "heart", accent: "♥" },
  { id: "on-se-capte", label: "On se capte !", image: onSeCapte.url, motion: "wink", accent: "✦" },
  { id: "mdr", label: "MDR !", image: mdr.url, motion: "laugh", accent: "✦" },
  { id: "hmm", label: "Hmm…", image: hmm.url, motion: "ponder", accent: "…" },
  { id: "no-way", label: "No way !", image: noWay.url, motion: "shock", accent: "✦" },
  { id: "valide", label: "C’est validé !", image: valide.url, motion: "pop", accent: "✓" },
  { id: "j-arrive", label: "J’arrive !", image: jArrive.url, motion: "wave", accent: "✦" },
  { id: "bonne-nuit", label: "Bonne nuit", image: bonneNuit.url, motion: "sleep", accent: "Zzz" },
  { id: "bon-matin", label: "Bon matin !", image: bonMatin.url, motion: "morning", accent: "☀" },
  { id: "appelle-moi", label: "Appelle-moi !", image: appelleMoi.url, motion: "ring", accent: "✦" },
  { id: "bisous", label: "Bisous ❤️", image: bisous.url, motion: "kiss", accent: "♥" },
  { id: "bravo", label: "Bravo !", image: bravo.url, motion: "applause", accent: "✦" },
  { id: "laisse-tomber", label: "Laisse tomber !", image: laisseTomber.url, motion: "shrug", accent: "…" },
  { id: "connecte", label: "Connecté !", image: connecte.url, motion: "bump", accent: "✦" },
] as const;

export type ElleSticker = (typeof elleStickers)[number];
export type ElleStickerId = ElleSticker["id"];
export const findElleSticker = (id: string) => elleStickers.find(sticker => sticker.id === id);