import { Clock3, Gift, Images, PartyPopper, type LucideIcon } from "lucide-react";
import amourArt from "@/assets/animation-amour.jpg";
import beauteArt from "@/assets/animation-beaute.jpg";
import journeeArt from "@/assets/animation-journee.jpg";
import nuitArt from "@/assets/animation-nuit.jpg";
import voyageArt from "@/assets/animation-voyage.jpg";
import amitieArt from "@/assets/animation-amitie.jpg";
import amour01 from "@/assets/amour/amour-01.png";
import amour02 from "@/assets/amour/amour-02.png";
import amour03 from "@/assets/amour/amour-03.png";
import amour04 from "@/assets/amour/amour-04.png";
import amour05 from "@/assets/amour/amour-05.png";
import amour06 from "@/assets/amour/amour-06.png";
import amour07 from "@/assets/amour/amour-07.png";
import amour08 from "@/assets/amour/amour-08.png";
import amour09 from "@/assets/amour/amour-09.png";
import amour10 from "@/assets/amour/amour-10.png";

/**
 * Modèle d'une WIPP Surprise. Type, design et animation sont indépendants :
 * une animation n'est jamais liée à un design ni à un type.
 * Règle de révélation chez le destinataire : REVEAL_COMPLETE → PLAY_SELECTED_ANIMATION.
 */
export type SurpriseType = "scratch" | "countdown" | "gift" | "confetti";
export type CountdownOptions = { seconds: number };
export type SurpriseOptions = { countdown?: CountdownOptions };

export type Surprise = {
  id: string;
  message: string;
  surpriseType: SurpriseType;
  designId: string | null;
  animationId: string | null;
  surpriseOptions: SurpriseOptions;
  time: string;
  mine: boolean;
};

export type SurpriseDesignItem = { id: string; label: string; mark: string; art?: string };
export type SurpriseAnimationItem = { id: string; label: string; art: string };

/** Libellé et icône du 2e bouton, selon le type choisi. « Ajouter une animation » ne change jamais. */
export const designPicker: Record<SurpriseType, { label: string; icon: LucideIcon }> = {
  scratch: { label: "Choisir la carte à gratter", icon: Images },
  countdown: { label: "Choisir le compte à rebours", icon: Clock3 },
  gift: { label: "Choisir le cadeau", icon: Gift },
  confetti: { label: "Choisir les confettis", icon: PartyPopper },
};

/** Catalogue des designs par type. Les visuels définitifs seront fournis et ajoutés ici. */
export const surpriseDesigns: Record<SurpriseType, SurpriseDesignItem[]> = {
  scratch: [
    { id: "heart", label: "Cœur", mark: "♥" },
    { id: "stars", label: "Étoiles", mark: "✦" },
    { id: "crown", label: "Couronne", mark: "♛" },
    { id: "neon", label: "Néon", mark: "♡" },
  ],
  countdown: [],
  gift: [],
  confetti: [],
};

/** Durées proposées pour le compte à rebours (réglage provisoire). */
export const countdownChoices = [
  { seconds: 10, label: "10 secondes" },
  { seconds: 60, label: "1 minute" },
  { seconds: 300, label: "5 minutes" },
  { seconds: 3600, label: "1 heure" },
];

/** Animations finales. Les images sont provisoires ; les animations WIPP seront branchées par id. */
export const surpriseAnimations: SurpriseAnimationItem[] = [
  { id: "amour", label: "Amour", art: amour03 },
  { id: "beaute", label: "Beauté", art: beauteArt },
  { id: "bonne-journee", label: "Bonne journée", art: journeeArt },
  { id: "bonne-nuit", label: "Bonne nuit", art: nuitArt },
  { id: "voyage", label: "Voyage", art: voyageArt },
  { id: "amitie", label: "Amitié", art: amitieArt },
];

export const findAnimation = (id: string | null) => surpriseAnimations.find(a => a.id === id) ?? null;

/** Les 10 visuels Amour, découpés de la planche fournie (fond transparent). */
export const amourAssets = [amour01, amour02, amour03, amour04, amour05, amour06, amour07, amour08, amour09, amour10];
export const defaultDesign = (type: SurpriseType) => surpriseDesigns[type][0]?.id ?? null;
export const defaultOptions = (type: SurpriseType): SurpriseOptions =>
  type === "countdown" ? { countdown: { seconds: countdownChoices[0]!.seconds } } : {};
