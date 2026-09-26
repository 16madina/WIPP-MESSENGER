import { useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { Pressable } from "./Pressable";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { layout } from "@/theme/theme";

const tones = ["Tendre", "Drôle", "Poétique", "Enthousiaste", "Sobre"] as const;

/** Assistant : décrit l'occasion + ton, le texte généré arrive en direct dans le champ, modifiable. */
export function SurpriseAssistant({ onText, compact = false }: { onText: (text: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [tone, setTone] = useState<string>(tones[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (busy || occasion.trim().length < 2) return;
    setBusy(true); setError(null); haptic("light");
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/surprise-ai", {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ occasion, tone }),
      });
      if (!res.ok || !res.body) { setError((await res.text()) || "La génération a échoué."); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let buf = ""; let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "response.output_text.delta") { text += ev.delta; onText(text.slice(0, layout.surpriseMessageLimit)); }
            else if (ev.type === "response.failed" || ev.type === "error") setError("La génération a échoué.");
          } catch { /* ligne partielle */ }
        }
      }
      if (!text.trim()) setError("Aucun message proposé, modifie la description.");
      else haptic("success");
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError("Connexion impossible.");
    } finally { setBusy(false); abortRef.current = null; }
  };

  if (!open) return (
    <Pressable onClick={() => { setOpen(true); haptic("light"); }} className={compact ? "surprise-send flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold text-wipp-surprise-ink" : "mt-2 flex w-full items-center gap-2 rounded-[8px] border border-wipp-surprise-line bg-wipp-surprise-ink px-3 py-2.5 text-left text-wipp-surprise-gold"}>
      <WandSparkles size={compact ? 16 : 18} /><span>{compact ? "Assistant ✧" : "Écrire avec l'assistant"}</span>
    </Pressable>
  );
  return (
    <div className={compact ? "absolute left-0 right-0 top-full z-20 mt-2 rounded-[12px] border border-wipp-surprise-line bg-wipp-surprise-ink p-3 text-wipp-fg shadow-lift" : "mt-2 rounded-[12px] border border-wipp-surprise-line bg-wipp-surprise-ink p-3 text-wipp-fg"}>
      <div className="mb-2 flex items-center gap-2 text-wipp-surprise-gold"><WandSparkles size={18} /><span className="type-subhead font-semibold">Assistant surprise</span></div>
      <input aria-label="Occasion" value={occasion} maxLength={300} onChange={e => setOccasion(e.target.value)} placeholder="L'occasion… ex. anniversaire de Deena, 30 ans" className="w-full rounded-[8px] bg-wipp-surface px-3 py-2.5 type-body text-wipp-fg outline-none placeholder:text-wipp-muted" />
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto" role="group" aria-label="Ton">
        {tones.map(t => <Pressable key={t} aria-pressed={tone === t} onClick={() => setTone(t)} className={`shrink-0 rounded-full border px-3 py-1.5 type-footnote ${tone === t ? "border-wipp-surprise-gold bg-wipp-surprise-gold text-wipp-surprise-ink" : "border-wipp-glass-border text-wipp-fg"}`}>{t}</Pressable>)}
      </div>
      {error && <p className="mt-2 type-footnote text-wipp-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Pressable onClick={() => { abortRef.current?.abort(); setOpen(false); }} className="flex-1 rounded-full border border-wipp-glass-border py-2.5 type-subhead">Fermer</Pressable>
        <Pressable onClick={busy ? () => abortRef.current?.abort() : generate} disabled={!busy && occasion.trim().length < 2} className="flex-[2] rounded-full bg-wipp-surprise-gold py-2.5 type-subhead font-semibold text-wipp-surprise-ink disabled:opacity-40">{busy ? "Arrêter" : "Générer le message"}</Pressable>
      </div>
    </div>
  );
}
