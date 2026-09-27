import { Check, Monitor, Smartphone, Tag } from "lucide-react";
import { Header, Row, Section, StatusBar } from "@/components/ui";
import { useWgoStore } from "@/lib/store";

/** Carte de visite WIPP — UI uniquement : aucune donnée backend de carte pro n'existe encore. */
export function BusinessCardScreen() {
  const pop = useWgoStore((s) => s.pop);
  const me = useWgoStore((s) => s.me);
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Ma carte de visite" onBack={pop} />
      <div className="px-5 pt-4">
        <div className="rounded-3xl bg-surface p-5 shadow-sm">
          <Tag className="size-6 text-accent" />
          <p className="mt-3 text-[17px] font-semibold">{me?.name ?? "Ton nom"}</p>
          <p className="text-[14px] text-muted">Activité · Ville</p>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          Aperçu seulement : la carte de visite professionnelle n'est pas encore enregistrée sur ton compte.
        </p>
      </div>
    </div>
  );
}

/** Appareils connectés — architecture prête, révocation non disponible tant que le serveur ne la gère pas. */
export function DevicesScreen() {
  const pop = useWgoStore((s) => s.pop);
  const mobile = typeof navigator !== "undefined" && /iPhone|Android/i.test(navigator.userAgent);
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Appareils" onBack={pop} />
      <div className="mt-4">
        <Section title="Cet appareil">
          <Row
            icon={mobile ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
            label={mobile ? "Téléphone" : "Navigateur web"}
            value="Actif"
          />
        </Section>
      </div>
      <p className="px-6 pt-3 text-[13px] leading-relaxed text-muted">
        La liste des autres appareils et la déconnexion à distance arriveront avec l'app native.
      </p>
    </div>
  );
}

const LANGS: { id: "fr" | "en"; label: string; ready: boolean }[] = [
  { id: "fr", label: "Français", ready: true },
  { id: "en", label: "English", ready: false },
];

/** Langue — structure de sélection ; seule la traduction française est complète. */
export function LanguageScreen() {
  const pop = useWgoStore((s) => s.pop);
  const language = useWgoStore((s) => s.language);
  const setLanguage = useWgoStore((s) => s.setLanguage);
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Langue" onBack={pop} />
      <div className="mt-4">
        <Section title="Langue de l'app">
          {LANGS.map((l) => (
            <Row
              key={l.id}
              label={l.ready ? l.label : `${l.label} (partielle)`}
              trailing={language === l.id ? <Check className="size-4 text-accent" /> : undefined}
              onClick={() => setLanguage(l.id)}
            />
          ))}
        </Section>
      </div>
      <p className="px-6 pt-3 text-[13px] leading-relaxed text-muted">
        WIPP est entièrement en français. La traduction anglaise n'est pas encore complète.
      </p>
    </div>
  );
}
