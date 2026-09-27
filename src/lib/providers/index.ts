/**
 * Fournisseurs remplaçables (web aujourd'hui, natif dans Cursor).
 * L'interface ne dépend que de ces contrats : remplacer l'implémentation
 * ne demande aucune refonte d'écran.
 */

/* ---------- Proximité (WIPP Touch) ---------- */
export type TouchState =
  | "ready" | "searching" | "detected" | "confirming" | "request_sent"
  | "accepted" | "declined" | "expired" | "multiple_devices" | "failed";

export type PublicCard = { id: string; displayName: string; username: string; avatar?: string };

export interface ProximityProvider {
  /** "native" = BLE/NFC réel ; "simulated" = démo web assumée. */
  readonly kind: "native" | "simulated";
  /** Diffuse un jeton court (jamais numéro/e-mail/identifiant permanent). */
  start(token: string, onFound: (cards: PublicCard[]) => void): () => void;
}

export const webProximity: ProximityProvider = {
  kind: "simulated",
  start(_token, onFound) {
    // Le navigateur ne sait pas détecter un téléphone voisin : on ne prétend rien.
    const id = window.setTimeout(() => onFound([]), 6000);
    return () => window.clearTimeout(id);
  },
};

/* ---------- Scanner QR ---------- */
export interface QRScannerProvider {
  isSupported(): boolean;
  /** Lance la lecture ; appelle onCode une seule fois puis s'arrête. */
  start(video: HTMLVideoElement, onCode: (raw: string) => void): Promise<{ stop: () => void; torch?: (on: boolean) => Promise<void> }>;
}

type Detector = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };

export const webQrScanner: QRScannerProvider = {
  isSupported() {
    return typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;
  },
  async start(video, onCode) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();
    const Ctor = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    const detector = new Ctor({ formats: ["qr_code"] });
    let alive = true;
    const stop = () => {
      alive = false;
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };
    const tick = async () => {
      if (!alive) return;
      try {
        const hits = await detector.detect(video);
        if (alive && hits[0]?.rawValue) {
          stop();
          onCode(hits[0].rawValue);
          return;
        }
      } catch { /* image pas prête */ }
      window.setTimeout(tick, 220);
    };
    void tick();
    const track = stream.getVideoTracks()[0];
    const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
    return {
      stop,
      torch: caps.torch
        ? (on) => track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
        : undefined,
    };
  },
};

/* ---------- Protection d'écran ---------- */
export type ProtectionLevel = "none" | "sensitive" | "view_once" | "private_chat" | "story" | "profile_photo";

export interface ScreenProtectionProvider {
  readonly kind: "native" | "web";
  /** Web : masque le contenu quand l'onglet est caché (meilleur effort, sans garantie). */
  apply(level: ProtectionLevel): () => void;
}

export const webScreenProtection: ScreenProtectionProvider = {
  kind: "web",
  apply(level) {
    if (level === "none" || typeof document === "undefined") return () => {};
    const root = document.documentElement;
    const onVis = () => root.toggleAttribute("data-privacy-shield", document.hidden);
    document.addEventListener("visibilitychange", onVis);
    root.setAttribute("data-protect", level);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      root.removeAttribute("data-protect");
      root.removeAttribute("data-privacy-shield");
    };
  },
};

/* ---------- Biométrie ---------- */
export interface BiometricProvider {
  isAvailable(): Promise<boolean>;
  authenticate(reason: string): Promise<boolean>;
}
export const webBiometric: BiometricProvider = {
  async isAvailable() { return false; }, // natif (Face ID / empreinte) dans Cursor
  async authenticate() { return false; },
};

/* ---------- Partage ---------- */
export interface ShareProvider {
  share(p: { title: string; text?: string; url: string }): Promise<"shared" | "copied" | "failed">;
}
export const webShare: ShareProvider = {
  async share(p) {
    try {
      if (navigator.share) { await navigator.share(p); return "shared"; }
      await navigator.clipboard.writeText(p.url);
      return "copied";
    } catch {
      try { await navigator.clipboard.writeText(p.url); return "copied"; } catch { return "failed"; }
    }
  },
};

/* ---------- Notifications ---------- */
export interface NotificationProvider {
  /** Titre/texte à afficher ; masqué pour WIPP Privé. */
  format(n: { sender: string; body: string; privateChat: boolean }): { title: string; body: string };
}
export const webNotifications: NotificationProvider = {
  format(n) {
    return n.privateChat ? { title: "WIPP", body: "Nouveau message" } : { title: n.sender, body: n.body };
  },
};

export const providers = {
  proximity: webProximity,
  qrScanner: webQrScanner,
  screenProtection: webScreenProtection,
  biometric: webBiometric,
  share: webShare,
  notifications: webNotifications,
};
