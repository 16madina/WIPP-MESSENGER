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

import m01 from "@/assets/stickers/mood/va-la-bas.png.asset.json";
import m02 from "@/assets/stickers/mood/stop.png.asset.json";
import m03 from "@/assets/stickers/mood/hahaha.png.asset.json";
import m04 from "@/assets/stickers/mood/pas-aujourdhui.png.asset.json";
import m05 from "@/assets/stickers/mood/le-boss.png.asset.json";
import m06 from "@/assets/stickers/mood/trop-tot.png.asset.json";
import m07 from "@/assets/stickers/mood/ca-marche.png.asset.json";
import m08 from "@/assets/stickers/mood/valide.png.asset.json";
import m09 from "@/assets/stickers/mood/bisousss.png.asset.json";
import m10 from "@/assets/stickers/mood/nimporte-quoi.png.asset.json";
import m11 from "@/assets/stickers/mood/bien-joue.png.asset.json";
import m12 from "@/assets/stickers/mood/ecoute-bien.png.asset.json";
import m13 from "@/assets/stickers/mood/laisse-moi.png.asset.json";
import m14 from "@/assets/stickers/mood/cool.png.asset.json";
import m15 from "@/assets/stickers/mood/vraiment.png.asset.json";
import m16 from "@/assets/stickers/mood/oh-non.png.asset.json";
import m17 from "@/assets/stickers/mood/yesss.png.asset.json";
import m18 from "@/assets/stickers/mood/dodo.png.asset.json";
import m19 from "@/assets/stickers/mood/tchip.png.asset.json";
import m20 from "@/assets/stickers/mood/focus.png.asset.json";

/** Collection « Mood » : les 20 stickers comiques. */
export const moodStickers = [
  { id: "mood-va-la-bas", label: "Va là-bas !", image: m01.url, motion: "wave", accent: "👉" },
  { id: "mood-stop", label: "Stop !", image: m02.url, motion: "pop", accent: "✋" },
  { id: "mood-hahaha", label: "HAHAHA !", image: m03.url, motion: "laugh", accent: "😂" },
  { id: "mood-pas-aujourdhui", label: "Pas aujourd’hui !", image: m04.url, motion: "shrug", accent: "☕" },
  { id: "mood-le-boss", label: "Le boss !", image: m05.url, motion: "pop", accent: "👑" },
  { id: "mood-trop-tot", label: "Trop tôt !", image: m06.url, motion: "sleep", accent: "😴" },
  { id: "mood-ca-marche", label: "Ça marche !", image: m07.url, motion: "bounce", accent: "💸" },
  { id: "mood-valide", label: "Validé !", image: m08.url, motion: "pop", accent: "✓" },
  { id: "mood-bisousss", label: "Bisousss !", image: m09.url, motion: "kiss", accent: "♥" },
  { id: "mood-nimporte-quoi", label: "N’importe quoi !", image: m10.url, motion: "shrug", accent: "😤" },
  { id: "mood-bien-joue", label: "Bien joué !", image: m11.url, motion: "wink", accent: "👍" },
  { id: "mood-ecoute-bien", label: "Écoute bien !", image: m12.url, motion: "ponder", accent: "👂" },
  { id: "mood-laisse-moi", label: "Laisse-moi !", image: m13.url, motion: "wave", accent: "✋" },
  { id: "mood-cool", label: "Cool !", image: m14.url, motion: "wink", accent: "😎" },
  { id: "mood-vraiment", label: "Vraiment ?!", image: m15.url, motion: "ponder", accent: "?" },
  { id: "mood-oh-non", label: "Oh non…", image: m16.url, motion: "shock", accent: "🤦" },
  { id: "mood-yesss", label: "Yesss !", image: m17.url, motion: "applause", accent: "🎉" },
  { id: "mood-dodo", label: "Dodo…", image: m18.url, motion: "sleep", accent: "Zzz" },
  { id: "mood-tchip", label: "Tchip !", image: m19.url, motion: "shrug", accent: "😒" },
  { id: "mood-focus", label: "Focus !", image: m20.url, motion: "pop", accent: "👑" },
] as const;

import n01 from "@/assets/stickers/mood/toi-la-2.png.asset.json";
import n02 from "@/assets/stickers/mood/cours-2.png.asset.json";
import n03 from "@/assets/stickers/mood/hahaha-2.png.asset.json";
import n04 from "@/assets/stickers/mood/pas-mon-probleme-2.png.asset.json";
import n05 from "@/assets/stickers/mood/nananana-2.png.asset.json";
import n06 from "@/assets/stickers/mood/hum-2.png.asset.json";
import n07 from "@/assets/stickers/mood/mdr-2.png.asset.json";
import n08 from "@/assets/stickers/mood/je-suis-ko-2.png.asset.json";
import n09 from "@/assets/stickers/mood/bye-bye-2.png.asset.json";
import n10 from "@/assets/stickers/mood/je-vais-taper-2.png.asset.json";
import n11 from "@/assets/stickers/mood/tu-parles-trop-2.png.asset.json";
import n12 from "@/assets/stickers/mood/oh-mon-dieu-2.png.asset.json";
import n13 from "@/assets/stickers/mood/je-te-vois-2.png.asset.json";
import n14 from "@/assets/stickers/mood/argent-dabord-2.png.asset.json";
import n15 from "@/assets/stickers/mood/degage-2.png.asset.json";
import n16 from "@/assets/stickers/mood/cest-bon-hein-2.png.asset.json";
import n17 from "@/assets/stickers/mood/trop-mange-2.png.asset.json";
import n18 from "@/assets/stickers/mood/wesh-2.png.asset.json";
import n19 from "@/assets/stickers/mood/ecoutez-moi-bien-2.png.asset.json";
import n20 from "@/assets/stickers/mood/je-ne-sais-pas-2.png.asset.json";

/** Collection « Mood » série 2 : les 20 stickers comiques #2. */
const moodStickers2 = [
  { id: "mood2-toi-la", label: "Toi là !", image: n01.url, motion: "wave", accent: "👉" },
  { id: "mood2-cours", label: "Cours !!!", image: n02.url, motion: "bounce", accent: "💨" },
  { id: "mood2-hahaha", label: "Hahaha !", image: n03.url, motion: "laugh", accent: "😂" },
  { id: "mood2-pas-mon-probleme", label: "Pas mon problème !", image: n04.url, motion: "shrug", accent: "☕" },
  { id: "mood2-nananana", label: "Nananana !", image: n05.url, motion: "laugh", accent: "😝" },
  { id: "mood2-hum", label: "Hum !", image: n06.url, motion: "ponder", accent: "😒" },
  { id: "mood2-mdr", label: "MDR !", image: n07.url, motion: "laugh", accent: "😂" },
  { id: "mood2-je-suis-ko", label: "Je suis KO !", image: n08.url, motion: "sleep", accent: "💫" },
  { id: "mood2-bye-bye", label: "Bye bye !", image: n09.url, motion: "wave", accent: "💅" },
  { id: "mood2-je-vais-taper", label: "Je vais taper !", image: n10.url, motion: "shock", accent: "🪰" },
  { id: "mood2-tu-parles-trop", label: "Tu parles trop !", image: n11.url, motion: "ponder", accent: "☕" },
  { id: "mood2-oh-mon-dieu", label: "Oh mon Dieu !", image: n12.url, motion: "shock", accent: "😱" },
  { id: "mood2-je-te-vois", label: "Je te vois !", image: n13.url, motion: "wink", accent: "👀" },
  { id: "mood2-argent-dabord", label: "Argent d’abord !", image: n14.url, motion: "bounce", accent: "💸" },
  { id: "mood2-degage", label: "Dégage !", image: n15.url, motion: "wave", accent: "✋" },
  { id: "mood2-cest-bon-hein", label: "C’est bon hein !", image: n16.url, motion: "heart", accent: "😋" },
  { id: "mood2-trop-mange", label: "Trop mangé !", image: n17.url, motion: "sleep", accent: "🍽️" },
  { id: "mood2-wesh", label: "Wesh ?!", image: n18.url, motion: "pop", accent: "🐐" },
  { id: "mood2-ecoutez-moi-bien", label: "Écoutez-moi bien !", image: n19.url, motion: "shock", accent: "📢" },
  { id: "mood2-je-ne-sais-pas", label: "Je ne sais pas !", image: n20.url, motion: "shrug", accent: "🤷" },
] as const;

export type MoodSticker = (typeof moodStickers)[number] | (typeof moodStickers2)[number];
export const allMoodStickers = [...moodStickers, ...moodStickers2];

export type WippSticker = (typeof wippStickers)[number];
export const allImageStickers = [...elleStickers, ...wippStickers, ...moodStickers];
export const findImageSticker = (id: string) => allImageStickers.find(sticker => sticker.id === id);