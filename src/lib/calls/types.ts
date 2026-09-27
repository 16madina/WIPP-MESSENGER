/**
 * Appels WIPP (lot 5) — modèle indépendant de l'interface et du moteur temps réel.
 * L'UI lit uniquement cet état ; un fournisseur (simulation aujourd'hui, moteur réel demain)
 * le fait évoluer via des événements. Aucune mention E2EE tant que l'architecture n'est pas auditée.
 */
export type CallStatus =
  | "idle"
  | "outgoing"
  | "ringing"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended"
  | "declined"
  | "missed"
  | "busy"
  | "failed";

export type CallMedia = "audio" | "video";

export type ParticipantState =
  | "invited"
  | "ringing"
  | "connecting"
  | "connected"
  | "left"
  | "declined"
  | "disconnected";

export type CallParticipant = {
  id: string;
  state: ParticipantState;
  muted: boolean;
  camOff: boolean;
};

export type CallQuality = "good" | "unstable" | "reduced";

export type CallOutcome = "answer" | "declined" | "busy" | "noAnswer" | "failed";

export type PermissionPrompt = {
  kind: "mic" | "camera";
  stage: "ask" | "denied";
};

export type CallState = {
  status: CallStatus;
  media: CallMedia;
  dir: "in" | "out";
  group: boolean;
  chatId?: string;
  title?: string;
  participants: CallParticipant[];
  speakingId: string | null;
  connectedAt?: number;
  duration?: number;
  endReason?: "ended" | "lost";
  muted: boolean;
  speaker: boolean;
  camOff: boolean;
  facing: "user" | "environment";
  minimized: boolean;
  quality: CallQuality;
  /** Demande de confirmation audio → vidéo. */
  videoAsk: boolean;
  permission: PermissionPrompt | null;
  micDenied: boolean;
  camDenied: boolean;
};

/** Événements émis par un fournisseur d'appel vers le moteur. */
export type ProviderEvent =
  | { type: "ringing" }
  | { type: "connecting" }
  | { type: "connected" }
  | { type: "outcome"; outcome: Exclude<CallOutcome, "answer"> }
  | { type: "participant"; id: string; patch: Partial<CallParticipant> }
  | { type: "speaking"; id: string | null }
  | { type: "quality"; quality: CallQuality }
  | { type: "reconnecting" }
  | { type: "reconnected" }
  | { type: "lost" };

/** Contrat que le futur moteur temps réel (natif / LiveKit) devra respecter. */
export interface CallProvider {
  startOutgoing(opts: { participantIds: string[]; media: CallMedia; outcome: CallOutcome }): void;
  acceptIncoming(participantIds: string[]): void;
  hangup(): void;
  setMuted(muted: boolean): void;
  setCamera(on: boolean): void;
  invite(userId: string): void;
  dispose(): void;
}
