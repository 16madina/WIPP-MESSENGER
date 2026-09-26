/**
 * Catalogue officiel des stickers WIPP, repris tel quel du dépôt 16madina/wipp :
 * mêmes identifiants, mêmes réglages (motion, fx, sound, moment, loopSoft).
 * Packs filmés (elle, lui, fun, fun2) : vidéo MP4 à fond vert jouée sur canvas,
 * image WebP en secours. Packs image (sig, moji, scene) : PNG intact + geste CSS.
 */

export type StickerFxKind =
  | "hearts" | "confetti" | "disco" | "shake" | "flame" | "flash"
  | "heartwave" | "rays" | "notes" | "crown" | "steam" | "ring";
export type StickerMoment = "bravo" | "alert" | "love" | "wipp";
export type StickerSoundKind =
  | "whoosh" | "mwah" | "laugh" | "dundun" | "bling" | "alarm" | "beat" | "jingle"
  | "hiss" | "party" | "clap" | "bonk" | "zip" | "ching" | "pop" | "crystal"
  | "boss" | "charge" | "notes" | "ding" | "arcade" | "tada" | "siren" | "clack"
  | "heart" | "film" | "ting";

export type StickerDef = {
  id: string;
  pack: "elle" | "lui" | "fun" | "fun2" | "sig" | "moji" | "scene";
  label: string;
  /** Image fixe (secours et aperçu du sélecteur). */
  image: string;
  /** Vidéo à fond vert, jouée telle quelle quand elle existe. */
  video?: string;
  /** Boucle douce : la vidéo tourne en continu, un peu ralentie. */
  loopSoft?: boolean;
  /** Geste CSS pour les packs image. */
  motion?: string;
  /** Effet en couche séparée (cœurs, confettis, couronne…). */
  fx?: StickerFxKind;
  /** Petit son synthétisé. */
  sound?: StickerSoundKind;
  /** WIPP Moment plein écran : joué une fois à l'arrivée, rejoué au toucher. */
  moment?: StickerMoment;
};

const elle = (id: string, label: string, extra: Partial<StickerDef> = {}): StickerDef =>
  ({ id, pack: "elle", label, image: `/stickers/${id}.webp`, video: `/stickers/${id}.mp4`, ...extra });
const lui = (id: string, label: string, extra: Partial<StickerDef> = {}): StickerDef =>
  ({ id: `lui-${id}`, pack: "lui", label, image: `/stickers/lui/${id}.webp`, video: `/stickers/lui/${id}.mp4`, ...extra });
const fun = (id: string, label: string, extra: Partial<StickerDef> = {}): StickerDef =>
  ({ id: `fun-${id}`, pack: "fun", label, image: `/stickers/fun/${id}.webp`, video: `/stickers/fun/${id}.mp4`, ...extra });
const fun2 = (id: string, label: string, extra: Partial<StickerDef> = {}): StickerDef =>
  ({ id: `fun2-${id}`, pack: "fun2", label, image: `/stickers/fun2/${id}.webp`, video: `/stickers/fun2/${id}.mp4`, ...extra });
const sig = (id: string, label: string, motion: string, extra: Partial<StickerDef> = {}): StickerDef =>
  ({ id: `sig-${id}`, pack: "sig", label, image: `/stickers/sig/sig-${id}.png`, motion, ...extra });
const moji = (n: number, label: string, motion: string, extra: Partial<StickerDef> = {}): StickerDef =>
  ({ id: `moji-${String(n).padStart(2, "0")}`, pack: "moji", label, image: `/stickers/moji/moji-${String(n).padStart(2, "0")}.png`, motion, ...extra });
const scene = (n: number, label: string, motion: string, extra: Partial<StickerDef> = {}): StickerDef =>
  ({ id: `scene-${String(n).padStart(2, "0")}`, pack: "scene", label, image: `/stickers/scene/scene-${String(n).padStart(2, "0")}.png`, motion, ...extra });

export const elleStickers: StickerDef[] = [
  elle("wippe-moi", "Wippe-moi !"),
  elle("ca-wipp", "Ça WIPP !"),
  elle("merci", "Merci 💛", { loopSoft: true }),
  elle("on-se-capte", "On se capte !"),
  elle("mdr", "MDR !"),
  elle("hmm", "Hmm…"),
  elle("no-way", "No way !"),
  elle("valide", "C’est validé !"),
  elle("j-arrive", "J’arrive !"),
  elle("bonne-nuit", "Bonne nuit", { loopSoft: true }),
  elle("bon-matin", "Bon matin !", { loopSoft: true }),
  elle("appelle-moi", "Appelle-moi !"),
  elle("bisous", "Bisous ❤️", { loopSoft: true }),
  elle("bravo", "Bravo !"),
  elle("laisse-tomber", "Laisse tomber !"),
  elle("connecte", "Connecté !"),
];

export const luiStickers: StickerDef[] = [
  lui("wippe-moi", "Wippe-moi !"),
  lui("ca-wipp", "Ça WIPP !"),
  lui("bonne-nuit", "Bonne nuit !", { loopSoft: true }),
  lui("valide", "C’est validé !"),
  lui("mdr", "MDR !"),
  lui("hmm", "Hmm…"),
  lui("no-way", "No way !"),
  lui("on-se-capte", "On se capte !"),
  lui("j-arrive", "J’arrive !"),
  lui("bisous", "Bisous !", { loopSoft: true }),
  lui("bon-matin", "Bon matin !", { loopSoft: true }),
  lui("appelle-moi", "Appelle-moi !"),
  lui("laisse-tomber", "Laisse tomber !"),
  lui("bravo", "Bravo !"),
  lui("respect", "Respect !"),
  lui("connecte", "Connecté !"),
];

export const funStickers: StickerDef[] = [
  fun("va-la-bas", "Va là-bas !"),
  fun("stop", "Stop !"),
  fun("hahaha", "HAHAHA !"),
  fun("pas-aujourdhui", "Pas aujourd’hui !", { loopSoft: true }),
  fun("le-boss", "Le boss !"),
  fun("trop-tot", "Trop tôt !", { loopSoft: true }),
  fun("ca-marche", "Ça marche !"),
  fun("valide", "Validé !"),
  fun("bisousss", "Bisousss !", { loopSoft: true }),
  fun("nimporte-quoi", "N’importe quoi !"),
  fun("bien-joue", "Bien joué !"),
  fun("ecoute-bien", "Écoute bien !"),
  fun("laisse-moi", "Laisse-moi !"),
  fun("cool", "Cool !"),
  fun("vraiment", "Vraiment ?!"),
  fun("oh-non", "Oh non…"),
  fun("yesss", "Yesss !"),
  fun("dodo", "Dodo…", { loopSoft: true }),
  fun("tchip", "Tchip !"),
  fun("focus", "Focus !"),
];

export const fun2Stickers: StickerDef[] = [
  fun2("toi-la", "Toi là !"),
  fun2("cours", "Cours !!!"),
  fun2("hahaha", "Hahaha !"),
  fun2("pas-mon-probleme", "Pas mon problème !"),
  fun2("nananana", "Nananana !"),
  fun2("hum", "Hum !"),
  fun2("mdr", "MDR !"),
  fun2("je-suis-ko", "Je suis KO !"),
  fun2("bye-bye", "Bye bye !"),
  fun2("je-vais-taper", "Je vais taper !"),
  fun2("tu-parles-trop", "Tu parles trop !"),
  fun2("oh-mon-dieu", "Oh mon Dieu !"),
  fun2("je-te-vois", "Je te vois !"),
  fun2("argent-dabord", "Argent d’abord !"),
  fun2("degage", "Dégage !"),
  fun2("cest-bon-hein", "C’est bon hein !"),
  fun2("trop-mange", "Trop mangé !"),
  fun2("wesh", "Wesh ?!"),
  fun2("ecoutez-moi-bien", "Écoutez-moi bien !"),
  fun2("je-ne-sais-pas", "Je ne sais pas !"),
];

export const sigStickers: StickerDef[] = [
  sig("jarrive", "J’arrive !", "arrive", { sound: "whoosh" }),
  sig("coucou", "Coucou !", "coucou"),
  sig("tes-la", "T’es là ?", "peek"),
  sig("bonne-idee", "Bonne idée !", "idea"),
  sig("cafe", "Café ?", "cafe"),
  sig("bisous", "Bisous !", "bisous", { fx: "hearts", sound: "mwah" }),
  sig("mdrrr", "MDRRR", "mdr", { fx: "shake", sound: "laugh" }),
  sig("tu-mens", "Tu mens !", "mens", { sound: "dundun" }),
  sig("waaah", "Waaah !", "waah"),
  sig("valide", "C’est validé !", "valide", { fx: "confetti", sound: "bling" }),
  sig("on-se-capte", "On se capte !", "capte"),
  sig("self-care", "Self care", "care"),
  sig("je-regarde", "Je te regarde…", "eyes"),
  sig("en-route", "En route !", "route"),
  sig("bonne-nuit", "Bonne nuit", "nuit"),
  sig("debout", "Debout !", "debout", { sound: "alarm" }),
  sig("on-regarde", "On regarde ?", "popcorn"),
  sig("laisse-tomber", "Laisse tomber…", "crack"),
  sig("hmm", "Hmm…", "hmm"),
  sig("shopping", "Shopping ?", "shop"),
  sig("voyage", "Voyage ?", "voyage"),
  sig("ma-vibe", "Ma vibe", "vibe", { sound: "beat" }),
  sig("motive", "Motivé(e) !", "motive"),
  sig("appelle", "Appelle-moi !", "call"),
  sig("faim", "J’ai faim !", "faim"),
  sig("ca-paye", "Ça paye !", "paye"),
  sig("chill", "Chill…", "chill"),
  sig("toujours", "Toujours là !", "toujours"),
  sig("ca-wipp", "Ça WIPP !", "disco", { fx: "disco", sound: "jingle", moment: "wipp" }),
  sig("raconte", "Raconte !", "raconte"),
];

export const mojiStickers: StickerDef[] = [
  moji(1, "Fou rire", "laugh", { fx: "shake", sound: "laugh" }),
  moji(2, "Amoureux", "love"),
  moji(3, "Bisou", "kiss", { fx: "hearts", sound: "mwah" }),
  moji(4, "Cool", "cool", { sound: "bling" }),
  moji(5, "Cœur WIPP", "hug"),
  moji(6, "Gros chagrin", "cry"),
  moji(7, "Furieux", "rage", { sound: "hiss" }),
  moji(8, "Choqué", "shock"),
  moji(9, "Je te juge", "judge"),
  moji(10, "Hmm…", "hmm"),
  moji(11, "Dodo", "sleep"),
  moji(12, "Fête", "party", { fx: "confetti", sound: "party" }),
  moji(13, "Amour", "hands"),
  moji(14, "Validé", "yes"),
  moji(15, "Nope", "nope"),
  moji(16, "Bravo", "clap", { sound: "clap" }),
  moji(17, "Merci", "pray"),
  moji(18, "Facepalm", "palm", { sound: "bonk" }),
  moji(19, "King", "crown"),
  moji(20, "C’est chaud", "fire", { fx: "flame" }),
  moji(21, "Please", "plead"),
  moji(22, "Foufou", "silly"),
  moji(23, "Secret", "zip", { sound: "zip" }),
  moji(24, "Pas convaincu", "side"),
  moji(25, "Chill", "sip"),
  moji(26, "Money", "money", { sound: "ching" }),
  moji(27, "Mind blown", "boom", { fx: "flash", sound: "pop" }),
  moji(28, "WIPP Love", "wlove", { fx: "heartwave" }),
  moji(29, "J’arrive", "run", { sound: "whoosh" }),
  moji(30, "Peace", "peace"),
];

export const sceneStickers: StickerDef[] = [
  scene(1, "Parfait !", "sc-parfait", { fx: "ring", sound: "crystal" }),
  scene(2, "T’es un boss !", "sc-boss", { fx: "crown", sound: "boss" }),
  scene(3, "Mood…", "sc-mood"),
  scene(4, "Merci !", "sc-merci", { fx: "hearts" }),
  scene(5, "Je recharge", "sc-charge", { sound: "charge" }),
  scene(6, "Aïe aïe aïe !", "sc-aie", { fx: "shake", sound: "laugh" }),
  scene(7, "Pas mon problème !", "sc-shrug"),
  scene(8, "Bonne journée !", "sc-sun", { fx: "rays", sound: "notes" }),
  scene(9, "Gros bisous !", "sc-kiss", { fx: "hearts", sound: "mwah" }),
  scene(10, "Dors bien !", "sc-sleep"),
  scene(11, "Bonne musique !", "sc-music", { fx: "notes", sound: "beat" }),
  scene(12, "Pour toi !", "sc-rose"),
  scene(13, "Bravo !", "sc-bravo", { sound: "clap", moment: "bravo" }),
  scene(14, "C’est chaud là !", "sc-hot", { fx: "steam", sound: "hiss" }),
  scene(15, "On apprend toujours !", "sc-learn", { sound: "ding" }),
  scene(16, "J’adore !", "sc-adore", { sound: "pop", moment: "love" }),
  scene(17, "Allons-y !", "sc-go", { sound: "whoosh" }),
  scene(18, "Nope !", "sc-nope", { sound: "bonk" }),
  scene(19, "À plus tard !", "sc-later"),
  scene(20, "On joue ?", "sc-play", { sound: "arcade" }),
  scene(21, "On va loin !", "sc-fly"),
  scene(22, "See you soon !", "sc-plane"),
  scene(23, "Objectif !", "sc-target", { fx: "ring", sound: "ding" }),
  scene(24, "Toujours à ton service !", "sc-bot"),
  scene(25, "Bon appétit !", "sc-food", { sound: "tada" }),
  scene(26, "Alerte WIPP !", "sc-alert", { sound: "siren", moment: "alert" }),
  scene(27, "C’est confidentiel !", "sc-lock", { sound: "clack" }),
  scene(28, "Ça va aller !", "sc-heal", { sound: "heart" }),
  scene(29, "C’est une histoire de ouf !", "sc-film", { sound: "film" }),
  scene(30, "Prends soin de toi !", "sc-care", { fx: "heartwave", sound: "ting" }),
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

/** Durée de lecture d'un sticker filmé (secondes), reprise du dépôt. */
export const STICKER_PLAY_S = 3.05;
