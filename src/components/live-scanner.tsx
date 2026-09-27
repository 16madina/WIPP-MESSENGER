import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/ui";
import { providers } from "@/lib/providers";
import { parseWippQr, redeemTempToken } from "@/lib/qr-payload";
import { useWgoStore } from "@/lib/store";

/** Vrai scanner caméra (quand le navigateur l'autorise). S'arrête dès le premier QR. */
export function LiveScanner({ onResult }: { onResult: (message: string, userId?: string) => void }) {
  const users = useWgoStore((s) => s.users);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ctrl = useRef<{ stop: () => void; torch?: (on: boolean) => Promise<void> } | null>(null);
  const [phase, setPhase] = useState<"ask" | "live" | "denied" | "unsupported">("ask");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => () => ctrl.current?.stop(), []);

  function handle(raw: string) {
    setPhase("ask");
    try { navigator.vibrate?.(30); } catch { /* */ }
    const p = parseWippQr(raw);
    if (p.kind === "invalid") return onResult("Ce QR n'est pas un QR WIPP");
    let username = p.kind === "profile" ? p.username : undefined;
    if (p.kind === "temp") {
      const r = redeemTempToken(p.token);
      if (r.state === "expired") return onResult("QR expiré");
      if (r.state === "used") return onResult("QR déjà utilisé");
      if (r.state === "invalid") return onResult("Impossible de vérifier le QR");
      username = r.username;
    }
    const u = Object.values(users).find((x) => x.username?.toLowerCase() === username);
    if (!u) return onResult("Utilisateur introuvable");
    onResult("", u.id);
  }

  async function start() {
    if (!providers.qrScanner.isSupported()) return setPhase("unsupported");
    setPhase("live");
    try {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      ctrl.current = await providers.qrScanner.start(videoRef.current!, handle);
      setHasTorch(Boolean(ctrl.current.torch));
    } catch {
      setPhase("denied");
    }
  }

  const live = phase === "live";
  return (
    <div className="mx-5 mb-2 rounded-2xl bg-paper/8 p-3 ring-1 ring-paper/10">
      <div className={live ? "relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl bg-ink" : "hidden"}>
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
        <span className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-accent/80" />
        <span className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 animate-pulse bg-accent/80" />
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
          <Btn variant="secondary" onClick={() => { ctrl.current?.stop(); setPhase("ask"); }}>Fermer</Btn>
          {hasTorch ? (
            <Btn variant="secondary" onClick={() => { const v = !torchOn; setTorchOn(v); void ctrl.current?.torch?.(v); }}>
              Lampe
            </Btn>
          ) : null}
        </div>
      </div>
      {live ? null : phase === "denied" || phase === "unsupported" ? (
        <div className="text-center text-[13px] text-paper/70">
          <p className="font-semibold text-paper">
            {phase === "denied" ? "Caméra non autorisée" : "Scanner indisponible sur ce navigateur"}
          </p>
          <p className="mt-1">Tu peux rechercher par @username ou afficher ton QR.</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[14px] font-semibold">Autoriser la caméra</p>
          <p className="mt-1 text-[12px] text-paper/60">WIPP utilise la caméra pour scanner les QR codes.</p>
          <Btn className="mt-2 w-full" onClick={() => void start()}>Continuer</Btn>
        </div>
      )}
    </div>
  );
}
