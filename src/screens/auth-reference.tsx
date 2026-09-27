import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Btn } from "@/components/ui";
import { useWgoStore } from "@/lib/store";
import { toE164 } from "@/lib/firebase-phone";
import welcomeImage from "@/assets/wipp-auth-welcome.png.asset.json";
import phoneImage from "@/assets/wipp-auth-phone.png.asset.json";
import { COUNTRIES } from "./auth-chrome";

/** The supplied artwork includes the logo, photograph and copy; live controls sit over it. */
function Artwork({ src }: { src: string }) {
  return <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full" />;
}

export function WelcomeScreen() {
  const replace = useWgoStore((s) => s.replace);
  const push = useWgoStore((s) => s.push);
  return (
    <main className="relative size-full overflow-hidden bg-wipp-bg text-wipp-fg" aria-label="Bienvenue sur WIPP">
      <Artwork src={welcomeImage.url} />
      <Btn aria-label="Créer un compte" onClick={() => push({ name: "phone-entry" })} className="absolute! top-[70.7%] left-[5%] h-[7%]! w-[90%] rounded-full! bg-transparent! text-transparent!" />
      <Btn aria-label="J’ai déjà un compte" onClick={() => replace({ name: "login" })} className="absolute! top-[79.3%] left-[5%] h-[7%]! w-[90%] rounded-full! bg-transparent! text-transparent!" />
      <Btn aria-label="Conditions d’utilisation" onClick={() => push({ name: "legal", doc: "terms" })} className="absolute! top-[88%] left-[48%] h-[3.5%]! min-h-0! w-[35%] bg-transparent! p-0! opacity-0" />
      <Btn aria-label="Politique de confidentialité" onClick={() => push({ name: "legal", doc: "privacy" })} className="absolute! top-[91%] left-[32%] h-[3.5%]! min-h-0! w-[43%] bg-transparent! p-0! opacity-0" />
    </main>
  );
}

export function PhoneEntryScreen() {
  const pop = useWgoStore((s) => s.pop);
  const saveSignup = useWgoStore((s) => s.saveSignup);
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  function continueWithPhone() {
    const normalized = toE164(`${country.dial}${phone.replace(/\D/g, "").replace(/^0+/, "")}`);
    if (!normalized) {
      setError("Entre un numéro de téléphone valide.");
      return;
    }
    saveSignup({ phone: normalized, country: country.id });
    setError("");
    // The next step will be added when the rest of the flow is supplied.
  }

  return (
    <main className="relative size-full overflow-hidden bg-wipp-bg text-wipp-fg" aria-label="Ton numéro de téléphone">
      <Artwork src={phoneImage.url} />
      <Btn aria-label="Retour" onClick={pop} className="absolute! top-[11.5%] left-[4%] h-[6%]! w-[12%] bg-transparent! p-0! text-transparent!" />
      <Btn
        aria-label={`Pays : ${country.fr} (${country.dial})`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="absolute! top-[59%] left-[10%] h-[5.5%]! w-[80%] justify-between rounded-lg! bg-transparent! px-3! text-transparent!"
      >
        {country.id !== "CA" ? <span className="rounded-md bg-wipp-share-tile px-2 text-wipp-fg">{country.fr} ({country.dial})</span> : null}
      </Btn>
      {menuOpen ? (
        <div className="absolute top-[65%] left-[10%] z-20 max-h-[27%] w-[80%] overflow-y-auto rounded-lg border border-wipp-glass-border bg-wipp-share-panel shadow-lift">
          {COUNTRIES.map((item) => (
            <Btn key={item.id} variant="ghost" className="w-full justify-between rounded-none! px-4! text-left text-wipp-fg!" onClick={() => { setCountry(item); setMenuOpen(false); setError(""); }}>
              <span>{item.fr}</span><span className="text-wipp-muted">{item.dial}</span>
            </Btn>
          ))}
        </div>
      ) : null}
      <input
        aria-label="Numéro de téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={25}
        value={phone}
        onChange={(event) => { setPhone(event.target.value); setError(""); }}
        className="absolute top-[69.6%] left-[13%] h-[4.8%] w-[74%] rounded-sm bg-wipp-auth-input px-1 text-[18px] text-wipp-fg outline-none placeholder:text-wipp-muted"
        placeholder="(514) 123-4567"
      />
      {error ? <p role="alert" className="absolute top-[83%] left-[10%] rounded bg-wipp-share-panel px-2 text-[12px] text-wipp-danger">{error}</p> : null}
      <Btn aria-label="Continuer" onClick={continueWithPhone} className="absolute! top-[87.1%] left-[5%] h-[6.6%]! w-[90%] rounded-full! bg-transparent! text-transparent!" />
    </main>
  );
}