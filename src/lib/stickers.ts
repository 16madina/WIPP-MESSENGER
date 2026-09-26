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

import s01 from "@/assets/stickers/wipp/01-parfait.png.asset.json";
import s02 from "@/assets/stickers/wipp/02-tes-un-boss.png.asset.json";
import s03 from "@/assets/stickers/wipp/03-mood.png.asset.json";
import s04 from "@/assets/stickers/wipp/04-merci.png.asset.json";
import s05 from "@/assets/stickers/wipp/05-je-recharge.png.asset.json";
import s06 from "@/assets/stickers/wipp/06-aie-aie-aie.png.asset.json";
import s07 from "@/assets/stickers/wipp/07-pas-mon-probleme.png.asset.json";
import s08 from "@/assets/stickers/wipp/08-bonne-journee.png.asset.json";
import s09 from "@/assets/stickers/wipp/09-gros-bisous.png.asset.json";
import s10 from "@/assets/stickers/wipp/10-dors-bien.png.asset.json";
import s11 from "@/assets/stickers/wipp/11-bonne-musique.png.asset.json";
import s12 from "@/assets/stickers/wipp/12-pour-toi.png.asset.json";
import s13 from "@/assets/stickers/wipp/13-bravo.png.asset.json";
import s14 from "@/assets/stickers/wipp/14-cest-chaud.png.asset.json";
import s15 from "@/assets/stickers/wipp/15-on-apprend-toujours.png.asset.json";
import s16 from "@/assets/stickers/wipp/16-jadore.png.asset.json";
import s17 from "@/assets/stickers/wipp/17-allons-y.png.asset.json";
import s18 from "@/assets/stickers/wipp/18-nope.png.asset.json";
import s19 from "@/assets/stickers/wipp/19-a-plus-tard.png.asset.json";
import s20 from "@/assets/stickers/wipp/20-on-joue.png.asset.json";
import s21 from "@/assets/stickers/wipp/21-on-va-loin.png.asset.json";
import s22 from "@/assets/stickers/wipp/22-see-you-soon.png.asset.json";
import s23 from "@/assets/stickers/wipp/23-objectif.png.asset.json";
import s24 from "@/assets/stickers/wipp/24-toujours-a-ton-service.png.asset.json";
import s25 from "@/assets/stickers/wipp/25-bon-appetit.png.asset.json";
import s26 from "@/assets/stickers/wipp/26-alerte-wipp.png.asset.json";
import s27 from "@/assets/stickers/wipp/27-cest-confidentiel.png.asset.json";
import s28 from "@/assets/stickers/wipp/28-ca-va-aller.png.asset.json";
import s29 from "@/assets/stickers/wipp/29-histoire-de-ouf.png.asset.json";
import s30 from "@/assets/stickers/wipp/30-prends-soin-de-toi.png.asset.json";

/** Collection « Tout » : les 30 stickers officiels WIPP. */
export const wippStickers = [
  { id: "wipp-parfait", label: "Parfait !", image: s01.url, motion: "pop", accent: "✦" },
  { id: "wipp-tes-un-boss", label: "T’es un boss !", image: s02.url, motion: "pop", accent: "👑" },
  { id: "wipp-mood", label: "Mood…", image: s03.url, motion: "wink", accent: "😎" },
  { id: "wipp-merci", label: "Merci !", image: s04.url, motion: "heart", accent: "♥" },
  { id: "wipp-je-recharge", label: "Je recharge", image: s05.url, motion: "bounce", accent: "🔋" },
  { id: "wipp-aie-aie-aie", label: "Aïe aïe aïe !", image: s06.url, motion: "laugh", accent: "😂" },
  { id: "wipp-pas-mon-probleme", label: "Pas mon problème !", image: s07.url, motion: "shrug", accent: "😎" },
  { id: "wipp-bonne-journee", label: "Bonne journée !", image: s08.url, motion: "morning", accent: "☀" },
  { id: "wipp-gros-bisous", label: "Gros bisous !", image: s09.url, motion: "kiss", accent: "♥" },
  { id: "wipp-dors-bien", label: "Dors bien !", image: s10.url, motion: "sleep", accent: "Zzz" },
  { id: "wipp-bonne-musique", label: "Bonne musique !", image: s11.url, motion: "bounce", accent: "🎵" },
  { id: "wipp-pour-toi", label: "Pour toi !", image: s12.url, motion: "heart", accent: "🌹" },
  { id: "wipp-bravo", label: "Bravo !", image: s13.url, motion: "applause", accent: "🎉" },
  { id: "wipp-cest-chaud", label: "C’est chaud là !", image: s14.url, motion: "shock", accent: "🥵" },
  { id: "wipp-on-apprend", label: "On apprend toujours !", image: s15.url, motion: "ponder", accent: "💡" },
  { id: "wipp-jadore", label: "J’adore !", image: s16.url, motion: "heart", accent: "😍" },
  { id: "wipp-allons-y", label: "Allons-y !", image: s17.url, motion: "wave", accent: "☕" },
  { id: "wipp-nope", label: "Nope !", image: s18.url, motion: "pop", accent: "✋" },
  { id: "wipp-a-plus-tard", label: "À plus tard !", image: s19.url, motion: "wave", accent: "⏳" },
  { id: "wipp-on-joue", label: "On joue ?", image: s20.url, motion: "bounce", accent: "🎮" },
  { id: "wipp-on-va-loin", label: "On va loin !", image: s21.url, motion: "wave", accent: "💸" },
  { id: "wipp-see-you-soon", label: "See you soon !", image: s22.url, motion: "wave", accent: "✈" },
  { id: "wipp-objectif", label: "Objectif !", image: s23.url, motion: "pop", accent: "🎯" },
  { id: "wipp-toujours-a-ton-service", label: "Toujours à ton service !", image: s24.url, motion: "wave", accent: "🤖" },
  { id: "wipp-bon-appetit", label: "Bon appétit !", image: s25.url, motion: "pop", accent: "🍽" },
  { id: "wipp-alerte", label: "Alerte WIPP !", image: s26.url, motion: "shock", accent: "🚨" },
  { id: "wipp-confidentiel", label: "C’est confidentiel !", image: s27.url, motion: "pop", accent: "🔐" },
  { id: "wipp-ca-va-aller", label: "Ça va aller !", image: s28.url, motion: "heart", accent: "💛" },
  { id: "wipp-histoire-de-ouf", label: "C’est une histoire de ouf !", image: s29.url, motion: "applause", accent: "🎬" },
  { id: "wipp-prends-soin-de-toi", label: "Prends soin de toi !", image: s30.url, motion: "kiss", accent: "💛" },
] as const;

export type WippSticker = (typeof wippStickers)[number];
export const allImageStickers = [...elleStickers, ...wippStickers];
export const findImageSticker = (id: string) => allImageStickers.find(sticker => sticker.id === id);