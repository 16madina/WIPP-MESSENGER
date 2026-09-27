import { useEffect } from "react";
import { Check } from "lucide-react";
import { useWgoStore } from "@/lib/store";

/** Brief, non-interactive reward shown only after a new account is created. */
export function SignupCelebrationScreen({ username }: { username: string }) {
  const pop = useWgoStore((s) => s.pop);
  useEffect(() => {
    const timer = window.setTimeout(pop, 3300);
    return () => window.clearTimeout(timer);
  }, [pop]);

  return (
    <main aria-label="Bienvenue sur WIPP" className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-wipp-bg px-6 text-center text-wipp-fg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <i className="wipp-celebrate-spark absolute left-[21%] top-[26%] size-1 rounded-full bg-wipp-accent" />
        <i className="wipp-celebrate-spark absolute right-[19%] top-[34%] size-1.5 rounded-full bg-wipp-accent [animation-delay:350ms]" />
        <i className="wipp-celebrate-spark absolute left-[29%] bottom-[30%] size-1 rounded-full bg-wipp-accent [animation-delay:650ms]" />
        <i className="wipp-celebrate-spark absolute right-[30%] bottom-[24%] size-1 rounded-full bg-wipp-accent [animation-delay:900ms]" />
      </div>
      <div className="wipp-celebrate-logo relative mb-9">
        <img src="/brand/wipp-official.png" alt="WIPP" className="h-24 w-auto max-w-[68vw] object-contain drop-shadow-[0_0_24px_var(--wipp-surprise-glow)]" />
      </div>
      <span className="wipp-celebrate-check mb-8 flex size-14 items-center justify-center rounded-full bg-wipp-accent text-wipp-accent-fg shadow-glow" aria-label="Compte créé">
        <Check className="size-8" strokeWidth={3} />
      </span>
      <div className="wipp-celebrate-words">
        <h1 className="text-[29px] font-semibold leading-tight">Bienvenue sur WIPP ✨</h1>
        <p className="mt-3 text-[19px] font-medium text-wipp-accent">@{username}</p>
        <p className="mt-2 text-[17px] text-wipp-fg">Ton WIPP est prêt.</p>
      </div>
      <p className="wipp-celebrate-tagline absolute bottom-[18%] text-[16px] font-medium text-wipp-muted">Connecte ta vie.</p>
    </main>
  );
}