import { useEffect, useState } from "react";
import { Row, Section, Toggle } from "@/components/ui";
import type { ProtectionLevel } from "@/lib/providers";

const KEY = "wipp-protect";
const LEVELS: { key: Exclude<ProtectionLevel, "none">; label: string }[] = [
  { key: "view_once", label: "Médias vus une fois" },
  { key: "private_chat", label: "Conversations WIPP Privé" },
  { key: "story", label: "Stories" },
  { key: "profile_photo", label: "Photo de profil" },
  { key: "sensitive", label: "Contenus sensibles" },
];

export function getProtection(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
/** Niveau actif pour un contenu (le fournisseur natif appliquera la vraie protection). */
export function isProtected(level: ProtectionLevel) {
  return level !== "none" && getProtection()[level] !== false;
}

export function ProtectionSettings() {
  const [v, setV] = useState<Record<string, boolean>>({});
  useEffect(() => setV(getProtection()), []);
  const set = (k: string, on: boolean) => {
    const next = { ...v, [k]: on };
    setV(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  return (
    <div className="mt-4">
      <Section title="Protection des captures">
        {LEVELS.map((l) => (
          <Row key={l.key} label={l.label} trailing={<Toggle checked={v[l.key] !== false} onChange={(on) => set(l.key, on)} />} />
        ))}
      </Section>
      <p className="px-6 pt-3 text-[13px] leading-relaxed text-muted">
        WIPP masque ces contenus quand l'app passe en arrière-plan et signale les captures quand le téléphone le permet.
        Aucune protection n'est absolue : une autre personne peut toujours photographier l'écran.
      </p>
    </div>
  );
}
