import { useState } from "react";
import { Search } from "lucide-react";
import { Btn } from "@/components/ui";
import { COUNTRIES, REGION_NAMES, type Country } from "@/lib/countries";

/** Shared country picker for the illustrated onboarding and the legacy login. */
export function CountryList({ onPick, language = "fr" }: { onPick: (country: Country) => void; language?: "fr" | "en" }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const filtered = COUNTRIES.filter((country) =>
    !query || `${country.fr} ${country.en} ${country.dial} ${country.id}`.toLocaleLowerCase().includes(query),
  );
  let lastRegion = "";
  return <div className="flex min-h-0 flex-col text-wipp-fg">
    <label className="flex h-11 shrink-0 items-center gap-2 border-b border-wipp-glass-border px-3 text-wipp-muted">
      <Search className="size-4 shrink-0" />
      <input aria-label="Rechercher un pays" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un pays ou indicatif" className="min-w-0 flex-1 bg-transparent text-[14px] text-wipp-fg outline-none placeholder:text-wipp-muted" />
    </label>
    <div className="min-h-0 overflow-y-auto overscroll-contain">
      {filtered.map((country) => {
        const heading = lastRegion !== country.region;
        lastRegion = country.region;
        return <div key={country.id}>
          {heading ? <div className="sticky top-0 z-10 bg-wipp-share-panel px-4 py-2 text-[11px] font-bold uppercase text-wipp-muted">{language === "fr" ? REGION_NAMES[country.region] : country.region}</div> : null}
          <Btn variant="ghost" className="w-full min-w-0 justify-between rounded-none! px-4! text-left text-wipp-fg!" onClick={() => onPick(country)}>
            <span className="flex min-w-0 items-center gap-2"><img src={country.flag} alt="" className="h-4 w-6 shrink-0 object-cover" /><span className="truncate">{language === "fr" ? country.fr : country.en}</span></span>
            <span className="shrink-0 text-[13px] text-wipp-muted">{country.dial}</span>
          </Btn>
        </div>;
      })}
      {filtered.length === 0 ? <p className="p-4 text-center text-sm text-wipp-muted">Aucun pays trouvé</p> : null}
    </div>
  </div>;
}