import { haptics } from "@/theme/theme";

/** Vibration courte si disponible (Expo : remplacer par expo-haptics). */
export function haptic(kind: keyof typeof haptics = "light") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(haptics[kind]);
  } catch {
    /* non supporté */
  }
}
