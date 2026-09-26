/**
 * Effets et sons des stickers, repris du dépôt 16madina/wipp.
 * Les effets sont annoncés par l'événement « wipp-sticker-fx » et dessinés
 * par StickerFxLayer en couches séparées ; les sons sont synthétisés en
 * Web Audio (jamais de fichier) et coupés en mode silencieux ou mouvement réduit.
 */
import type { StickerFxKind, StickerMoment, StickerSoundKind } from "@/lib/stickers";

export type StickerFx = StickerFxKind | `moment-${StickerMoment}`;
export const STICKER_FX_EVENT = "wipp-sticker-fx";

export function soundAllowed() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return window.localStorage.getItem("wipp:sound") !== "off";
}

let ctx: AudioContext | null = null;

function ac() {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ||= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, t: number, dur: number, type: OscillatorType, gain = 0.08) {
  const audio = ac();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(t: number, dur: number, gain = 0.05) {
  const audio = ac();
  if (!audio) return;
  const n = Math.floor(audio.sampleRate * dur);
  const buf = audio.createBuffer(1, n, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = audio.createBufferSource();
  src.buffer = buf;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 800;
  const g = audio.createGain();
  g.gain.value = gain;
  src.connect(filter);
  filter.connect(g);
  g.connect(audio.destination);
  src.start(t);
}

function playSound(kind: StickerSoundKind) {
  const audio = ac();
  if (!audio) return;
  const t = audio.currentTime;
  switch (kind) {
    case "whoosh": noise(t, 0.28, 0.06); return;
    case "mwah": {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(640, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(g);
      g.connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.22);
      return;
    }
    case "laugh": tone(420, t, 0.08, "triangle", 0.06); tone(360, t + 0.1, 0.08, "triangle", 0.05); tone(480, t + 0.2, 0.1, "triangle", 0.05); return;
    case "dundun": tone(140, t, 0.16, "sine", 0.1); tone(98, t + 0.18, 0.22, "sine", 0.1); return;
    case "bling": tone(880, t, 0.12, "sine", 0.06); tone(880, t + 0.09, 0.1, "triangle", 0.05); noise(t + 0.05, 0.12, 0.04); return;
    case "alarm": tone(740, t, 0.1, "square", 0.05); tone(740, t + 0.14, 0.1, "square", 0.05); tone(740, t + 0.28, 0.12, "square", 0.05); return;
    case "beat": tone(120, t, 0.1, "sine", 0.1); tone(120, t + 0.22, 0.1, "sine", 0.08); return;
    case "jingle": tone(1046, t, 0.08, "triangle", 0.05); tone(1318, t + 0.08, 0.08, "triangle", 0.05); tone(1568, t + 0.16, 0.12, "triangle", 0.05); return;
    case "hiss": noise(t, 0.3, 0.04); return;
    case "party": tone(523, t, 0.1, "triangle", 0.06); tone(659, t + 0.1, 0.1, "triangle", 0.06); tone(784, t + 0.2, 0.14, "triangle", 0.06); noise(t, 0.2, 0.03); return;
    case "clap": noise(t, 0.05, 0.08); noise(t + 0.12, 0.05, 0.07); noise(t + 0.24, 0.06, 0.08); return;
    case "bonk": tone(180, t, 0.08, "sine", 0.09); tone(90, t + 0.06, 0.12, "triangle", 0.05); return;
    case "zip": noise(t, 0.16, 0.05); tone(1400, t, 0.12, "sawtooth", 0.02); return;
    case "ching": tone(988, t, 0.08, "sine", 0.06); tone(1318, t + 0.06, 0.14, "triangle", 0.05); tone(1976, t + 0.1, 0.12, "sine", 0.03); return;
    case "pop": tone(220, t, 0.06, "sine", 0.08); tone(880, t + 0.05, 0.1, "triangle", 0.05); noise(t + 0.04, 0.08, 0.05); return;
    case "crystal": tone(1568, t, 0.08, "sine", 0.04); tone(2093, t + 0.06, 0.12, "triangle", 0.03); return;
    case "boss": tone(196, t, 0.1, "square", 0.05); tone(392, t + 0.08, 0.12, "triangle", 0.04); return;
    case "charge": tone(220, t, 0.16, "sine", 0.04); tone(440, t + 0.12, 0.16, "sine", 0.04); tone(880, t + 0.26, 0.14, "triangle", 0.04); return;
    case "notes": tone(523, t, 0.1, "triangle", 0.05); tone(659, t + 0.12, 0.14, "sine", 0.04); return;
    case "ding": tone(1174, t, 0.14, "sine", 0.06); return;
    case "arcade": tone(440, t, 0.06, "square", 0.03); tone(554, t + 0.07, 0.06, "square", 0.03); tone(659, t + 0.14, 0.1, "square", 0.03); return;
    case "tada": tone(523, t, 0.1, "triangle", 0.05); tone(784, t + 0.1, 0.16, "sine", 0.05); return;
    case "siren": tone(620, t, 0.16, "sawtooth", 0.03); tone(880, t + 0.16, 0.16, "sawtooth", 0.03); tone(620, t + 0.32, 0.16, "sawtooth", 0.025); return;
    case "clack": tone(180, t, 0.05, "square", 0.05); noise(t, 0.06, 0.04); return;
    case "heart": tone(90, t, 0.12, "sine", 0.08); tone(90, t + 0.28, 0.14, "sine", 0.06); return;
    case "film": noise(t, 0.05, 0.08); noise(t + 0.08, 0.04, 0.05); return;
    case "ting": tone(1318, t, 0.16, "sine", 0.035); return;
    default: tone(523, t, 0.12, "triangle", 0.06); tone(659, t + 0.12, 0.12, "triangle", 0.05); tone(784, t + 0.24, 0.16, "sine", 0.05); tone(1046, t + 0.4, 0.2, "sine", 0.04);
  }
}

/** Joue l'effet (couche séparée) et le son d'un sticker ; coupé si mouvement réduit ou silence. */
export function playStickerCue(
  row: { fx?: StickerFxKind; sound?: StickerSoundKind; moment?: StickerMoment },
  loud: boolean,
) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const fx: StickerFx | undefined = row.moment ? `moment-${row.moment}` : row.fx;
  if (loud && fx) {
    window.dispatchEvent(new CustomEvent<StickerFx>(STICKER_FX_EVENT, { detail: fx }));
  }
  if (loud && row.sound && soundAllowed()) playSound(row.sound);
}
