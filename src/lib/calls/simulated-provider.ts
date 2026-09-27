import type { CallOutcome, CallMedia, CallProvider, ProviderEvent } from "./types";

/**
 * Fournisseur simulé : reproduit les délais et états d'un vrai appel pour tester l'interface.
 * À remplacer par le moteur temps réel sans toucher aux écrans.
 */
export class SimulatedCallProvider implements CallProvider {
  private timers: number[] = [];
  private speakTimer = 0;
  private connected = new Set<string>();
  private muted = new Set<string>();

  constructor(private emit: (e: ProviderEvent) => void) {}

  private later(ms: number, fn: () => void) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  startOutgoing({ participantIds, outcome }: { participantIds: string[]; media: CallMedia; outcome: CallOutcome }) {
    this.later(700, () => this.emit({ type: "ringing" }));
    if (outcome === "busy") return this.later(1800, () => this.emit({ type: "outcome", outcome: "busy" }));
    if (outcome === "failed") return this.later(2600, () => this.emit({ type: "outcome", outcome: "failed" }));
    if (outcome === "declined") return this.later(3600, () => this.emit({ type: "outcome", outcome: "declined" }));
    if (outcome === "noAnswer") return this.later(7000, () => this.emit({ type: "outcome", outcome: "noAnswer" }));
    this.later(2800, () => this.emit({ type: "connecting" }));
    this.later(3600, () => {
      this.emit({ type: "connected" });
      participantIds.forEach((id, i) => this.join(id, i === 0 ? 0 : 500 + i * 900));
    });
  }

  acceptIncoming(participantIds: string[]) {
    this.later(700, () => {
      this.emit({ type: "connected" });
      participantIds.forEach((id, i) => this.join(id, i * 600));
    });
  }

  private join(id: string, delay: number) {
    this.emit({ type: "participant", id, patch: { state: "connecting" } });
    this.later(delay + 600, () => {
      this.connected.add(id);
      this.emit({ type: "participant", id, patch: { state: "connected" } });
      this.startSpeaking();
    });
  }

  /** Rotation douce de la personne qui parle. */
  private startSpeaking() {
    if (this.speakTimer) return;
    const tick = () => {
      const pool = [...this.connected].filter((id) => !this.muted.has(id));
      const pick = pool.length && Math.random() > 0.2 ? pool[Math.floor(Math.random() * pool.length)]! : null;
      this.emit({ type: "speaking", id: pick });
    };
    tick();
    this.speakTimer = window.setInterval(tick, 2400);
  }

  invite(userId: string) {
    this.emit({ type: "participant", id: userId, patch: { state: "invited" } });
    this.later(1800, () => this.join(userId, 400));
  }

  /** Commandes de démonstration (pas dans le contrat) : pilotées depuis le menu « Plus ». */
  simulatePeer(id: string, patch: { muted?: boolean; camOff?: boolean; left?: boolean }) {
    if (patch.muted !== undefined) patch.muted ? this.muted.add(id) : this.muted.delete(id);
    if (patch.left) this.connected.delete(id);
    this.emit({
      type: "participant",
      id,
      patch: { ...("muted" in patch ? { muted: patch.muted } : {}), ...("camOff" in patch ? { camOff: patch.camOff } : {}), ...(patch.left ? { state: "left" } : {}) },
    });
  }
  simulateUnstable() {
    this.emit({ type: "quality", quality: "unstable" });
    this.later(2500, () => this.emit({ type: "quality", quality: "reduced" }));
    this.later(7000, () => this.emit({ type: "quality", quality: "good" }));
  }
  simulateDrop(recover: boolean) {
    this.emit({ type: "reconnecting" });
    this.later(recover ? 3500 : 5000, () => this.emit(recover ? { type: "reconnected" } : { type: "lost" }));
  }

  hangup() {
    this.dispose();
  }
  setMuted(_muted: boolean) {}
  setCamera(_on: boolean) {}
  dispose() {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    window.clearInterval(this.speakTimer);
    this.speakTimer = 0;
    this.connected.clear();
  }
}
