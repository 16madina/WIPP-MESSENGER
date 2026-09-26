/**
 * Catalogue officiel des stickers WIPP, issu du dépôt 16madina/wipp.
 * Packs filmés (elle, lui, fun, fun2) : vidéo MP4 à fond vert jouée sur canvas,
 * image WebP en secours. Packs image (sig, moji, scene) : PNG intact + geste CSS.
 */

export type StickerDef = {
  id: string;
  pack: "elle" | "lui" | "fun" | "fun2" | "sig" | "moji" | "scene";
  label: string;
  /** Image fixe (secours et aperçu). */
  image: string;
  /** Vidéo à fond vert, jouée telle quelle quand elle existe. */
  video?: string;
  /** Geste CSS pour les packs image (cœurs, confettis… restent des couches séparées). */
  motion: string;
  accent: string;
};

const elle = (id: string, label: string, motion: string, accent = "✦"): StickerDef =>
  ({ id: `elle-${id}`, pack: "elle", label, image: `/stickers/${id}.webp`, video: `/stickers/${id}.mp4`, motion, accent });
const lui = (id: string, label: string, motion: string, accent = "✦"): StickerDef =>
  ({ id: `lui-${id}`, pack: "lui", label, image: `/stickers/lui/${id}.webp`, video: `/stickers/lui/${id}.mp4`, motion, accent });
const fun = (id: string, label: string, motion: string, accent = "✦"): StickerDef =>
  ({ id: `fun-${id}`, pack: "fun", label, image: `/stickers/fun/${id}.webp`, video: `/stickers/fun/${id}.mp4`, motion, accent });
const fun2 = (id: string, label: string, motion: string, accent = "✦"): StickerDef =>
  ({ id: `fun2-${id}`, pack: "fun2", label, image: `/stickers/fun2/${id}.webp`, video: `/stickers/fun2/${id}.mp4`, motion, accent });
const sig = (id: string, label: string, motion: string, accent = "✦"): StickerDef =>
  ({ id: `sig-${id}`, pack: "sig", label, image: `/stickers/sig/sig-${id}.png`, motion, accent });
const moji = (n: number, label: string, motion: string, accent = "✦"): StickerDef =>
  ({ id: `moji-${String(n).padStart(2, "0")}`, pack: "moji", label, image: `/stickers/moji/moji-${String(n).padStart(2, "0")}.png`, motion, accent });
const scene = (n: number, label: string, motion: string, accent = "✦"): StickerDef =>
  ({ id: `scene-${String(n).padStart(2, "0")}`, pack: "scene", label, image: `/stickers/scene/scene-${String(n).padStart(2, "0")}.png`, motion, accent });

export const elleStickers: StickerDef[] = [
  elle("wippe-moi", "Wippe-moi !", "wink"),
  elle("ca-wipp", "Ça WIPP !", "bounce"),
  elle("merci", "Merci 💛", "heart", "♥"),
  elle("on-se-capte", "On se capte !", "wink"),
  elle("mdr", "MDR !", "laugh", "😂"),
  elle("hmm", "Hmm…", "ponder", "…"),
  elle("no-way", "No way !", "shock"),
  elle("valide", "C’est validé !", "pop", "✓"),
  elle("j-arrive", "J’arrive !", "wave"),
  elle("bonne-nuit", "Bonne nuit", "sleep", "Zzz"),
  elle("bon-matin", "Bon matin !", "morning", "☀"),
  elle("appelle-moi", "Appelle-moi !", "ring"),
  elle("bisous", "Bisous ❤️", "kiss", "♥"),
  elle("bravo", "Bravo !", "applause", "🎉"),
  elle("laisse-tomber", "Laisse tomber !", "shrug", "…"),
  elle("connecte", "Connecté !", "bump"),
];

export const luiStickers: StickerDef[] = [
  lui("wippe-moi", "Wippe-moi !", "wink"),
  lui("ca-wipp", "Ça WIPP !", "bounce"),
  lui("bonne-nuit", "Bonne nuit !", "sleep", "Zzz"),
  lui("valide", "C’est validé !", "pop", "✓"),
  lui("mdr", "MDR !", "laugh", "😂"),
  lui("hmm", "Hmm…", "ponder", "…"),
  lui("no-way", "No way !", "shock"),
  lui("on-se-capte", "On se capte !", "wink"),
  lui("j-arrive", "J’arrive !", "wave"),
  lui("bisous", "Bisous !", "kiss", "♥"),
  lui("bon-matin", "Bon matin !", "morning", "☀"),
  lui("appelle-moi", "Appelle-moi !", "ring"),
  lui("laisse-tomber", "Laisse tomber !", "shrug", "…"),
  lui("bravo", "Bravo !", "applause", "🎉"),
  lui("respect", "Respect !", "pop", "🫡"),
  lui("connecte", "Connecté !", "bump"),
];

export const funStickers: StickerDef[] = [
  fun("va-la-bas", "Va là-bas !", "wave", "👉"),
  fun("stop", "Stop !", "pop", "✋"),
  fun("hahaha", "HAHAHA !", "laugh", "😂"),
  fun("pas-aujourdhui", "Pas aujourd’hui !", "shrug", "☕"),
  fun("le-boss", "Le boss !", "pop", "👑"),
  fun("trop-tot", "Trop tôt !", "sleep", "😴"),
  fun("ca-marche", "Ça marche !", "bounce", "💸"),
  fun("valide", "Validé !", "pop", "✓"),
  fun("bisousss", "Bisousss !", "kiss", "♥"),
  fun("nimporte-quoi", "N’importe quoi !", "shrug", "😤"),
  fun("bien-joue", "Bien joué !", "wink", "👍"),
  fun("ecoute-bien", "Écoute bien !", "ponder", "👂"),
  fun("laisse-moi", "Laisse-moi !", "wave", "✋"),
  fun("cool", "Cool !", "wink", "😎"),
  fun("vraiment", "Vraiment ?!", "ponder", "?"),
  fun("oh-non", "Oh non…", "shock", "🤦"),
  fun("yesss", "Yesss !", "applause", "🎉"),
  fun("dodo", "Dodo…", "sleep", "Zzz"),
  fun("tchip", "Tchip !", "shrug", "😒"),
  fun("focus", "Focus !", "pop", "🎯"),
];

export const fun2Stickers: StickerDef[] = [
  fun2("toi-la", "Toi là !", "wave", "👉"),
  fun2("cours", "Cours !!!", "bounce", "💨"),
  fun2("hahaha", "Hahaha !", "laugh", "😂"),
  fun2("pas-mon-probleme", "Pas mon problème !", "shrug", "☕"),
  fun2("nananana", "Nananana !", "laugh", "😝"),
  fun2("hum", "Hum !", "ponder", "😒"),
  fun2("mdr", "MDR !", "laugh", "😂"),
  fun2("je-suis-ko", "Je suis KO !", "sleep", "💫"),
  fun2("bye-bye", "Bye bye !", "wave", "💅"),
  fun2("je-vais-taper", "Je vais taper !", "shock", "🪰"),
  fun2("tu-parles-trop", "Tu parles trop !", "ponder", "☕"),
  fun2("oh-mon-dieu", "Oh mon Dieu !", "shock", "😱"),
  fun2("je-te-vois", "Je te vois !", "wink", "👀"),
  fun2("argent-dabord", "Argent d’abord !", "bounce", "💸"),
  fun2("degage", "Dégage !", "wave", "✋"),
  fun2("cest-bon-hein", "C’est bon hein !", "heart", "😋"),
  fun2("trop-mange", "Trop mangé !", "sleep", "🍽️"),
  fun2("wesh", "Wesh ?!", "pop", "🐐"),
  fun2("ecoutez-moi-bien", "Écoutez-moi bien !", "shock", "📢"),
  fun2("je-ne-sais-pas", "Je ne sais pas !", "shrug", "🤷"),
];

export const sigStickers: StickerDef[] = [
  sig("jarrive", "J’arrive !", "wave"),
  sig("coucou", "Coucou !", "wave", "👋"),
  sig("tes-la", "T’es là ?", "ponder", "👀"),
  sig("bonne-idee", "Bonne idée !", "pop", "💡"),
  sig("cafe", "Café ?", "morning", "☕"),
  sig("bisous", "Bisous !", "kiss", "♥"),
  sig("mdrrr", "MDRRR", "laugh", "😂"),
  sig("tu-mens", "Tu mens !", "shock", "🤥"),
  sig("waaah", "Waaah !", "shock", "😱"),
  sig("valide", "C’est validé !", "pop", "✓"),
  sig("on-se-capte", "On se capte !", "wink"),
  sig("self-care", "Self care", "heart", "🛁"),
  sig("je-regarde", "Je te regarde…", "ponder", "👀"),
  sig("en-route", "En route !", "wave", "🚗"),
  sig("bonne-nuit", "Bonne nuit", "sleep", "Zzz"),
  sig("debout", "Debout !", "morning", "⏰"),
  sig("on-regarde", "On regarde ?", "pop", "🍿"),
  sig("laisse-tomber", "Laisse tomber…", "shrug", "…"),
  sig("hmm", "Hmm…", "ponder", "…"),
  sig("shopping", "Shopping ?", "bounce", "🛍"),
  sig("voyage", "Voyage ?", "wave", "✈"),
  sig("ma-vibe", "Ma vibe", "bounce", "🎵"),
  sig("motive", "Motivé(e) !", "applause", "💪"),
  sig("appelle", "Appelle-moi !", "ring"),
  sig("faim", "J’ai faim !", "pop", "🍔"),
  sig("ca-paye", "Ça paye !", "bounce", "💸"),
  sig("chill", "Chill…", "sleep", "😌"),
  sig("toujours", "Toujours là !", "heart", "💛"),
  sig("ca-wipp", "Ça WIPP !", "bounce"),
  sig("raconte", "Raconte !", "ponder", "🗣"),
];

export const mojiStickers: StickerDef[] = [
  moji(1, "Fou rire", "laugh", "😂"),
  moji(2, "Amoureux", "heart", "😍"),
  moji(3, "Bisou", "kiss", "♥"),
  moji(4, "Cool", "wink", "😎"),
  moji(5, "Cœur WIPP", "heart", "💛"),
  moji(6, "Gros chagrin", "sleep", "😢"),
  moji(7, "Furieux", "shock", "😡"),
  moji(8, "Choqué", "shock", "😱"),
  moji(9, "Je te juge", "ponder", "🧐"),
  moji(10, "Hmm…", "ponder", "…"),
  moji(11, "Dodo", "sleep", "Zzz"),
  moji(12, "Fête", "applause", "🎉"),
  moji(13, "Amour", "heart", "♥"),
  moji(14, "Validé", "pop", "✓"),
  moji(15, "Nope", "shrug", "✋"),
  moji(16, "Bravo", "applause", "👏"),
  moji(17, "Merci", "heart", "🙏"),
  moji(18, "Facepalm", "shrug", "🤦"),
  moji(19, "King", "pop", "👑"),
  moji(20, "C’est chaud", "shock", "🔥"),
  moji(21, "Please", "heart", "🥺"),
  moji(22, "Foufou", "laugh", "🤪"),
  moji(23, "Secret", "ponder", "🤫"),
  moji(24, "Pas convaincu", "ponder", "😒"),
  moji(25, "Chill", "sleep", "😌"),
  moji(26, "Money", "bounce", "💸"),
  moji(27, "Mind blown", "shock", "🤯"),
  moji(28, "WIPP Love", "heart", "💛"),
  moji(29, "J’arrive", "wave", "🏃"),
  moji(30, "Peace", "wink", "✌"),
];

export const sceneStickers: StickerDef[] = [
  scene(1, "Parfait !", "pop", "✦"),
  scene(2, "T’es un boss !", "pop", "👑"),
  scene(3, "Mood…", "wink", "😎"),
  scene(4, "Merci !", "heart", "♥"),
  scene(5, "Je recharge", "bounce", "🔋"),
  scene(6, "Aïe aïe aïe !", "laugh", "😂"),
  scene(7, "Pas mon problème !", "shrug", "😎"),
  scene(8, "Bonne journée !", "morning", "☀"),
  scene(9, "Gros bisous !", "kiss", "♥"),
  scene(10, "Dors bien !", "sleep", "Zzz"),
  scene(11, "Bonne musique !", "bounce", "🎵"),
  scene(12, "Pour toi !", "heart", "🌹"),
  scene(13, "Bravo !", "applause", "🎉"),
  scene(14, "C’est chaud là !", "shock", "🥵"),
  scene(15, "On apprend toujours !", "ponder", "💡"),
  scene(16, "J’adore !", "heart", "😍"),
  scene(17, "Allons-y !", "wave", "☕"),
  scene(18, "Nope !", "pop", "✋"),
  scene(19, "À plus tard !", "wave", "⏳"),
  scene(20, "On joue ?", "bounce", "🎮"),
  scene(21, "On va loin !", "wave", "💸"),
  scene(22, "See you soon !", "wave", "✈"),
  scene(23, "Objectif !", "pop", "🎯"),
  scene(24, "Toujours à ton service !", "wave", "🤖"),
  scene(25, "Bon appétit !", "pop", "🍽"),
  scene(26, "Alerte WIPP !", "shock", "🚨"),
  scene(27, "C’est confidentiel !", "pop", "🔐"),
  scene(28, "Ça va aller !", "heart", "💛"),
  scene(29, "C’est une histoire de ouf !", "applause", "🎬"),
  scene(30, "Prends soin de toi !", "kiss", "💛"),
];

export const allImageStickers: StickerDef[] = [
  ...elleStickers,
  ...luiStickers,
  ...funStickers,
  ...fun2Stickers,
  ...sigStickers,
  ...mojiStickers,
  ...sceneStickers,
];

export const findImageSticker = (id: string) => allImageStickers.find((sticker) => sticker.id === id);
