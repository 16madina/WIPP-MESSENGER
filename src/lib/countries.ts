import worldCountries from "world-countries";

export type Country = { id: string; dial: string; fr: string; en: string; flag: string; region: string };

const regionOrder = ["Africa", "Europe", "Americas", "Asia", "Oceania", "Antarctic"];
export const REGION_NAMES: Record<string, string> = {
  Africa: "Afrique", Europe: "Europe", Americas: "Amérique", Asia: "Asie", Oceania: "Océanie", Antarctic: "Antarctique",
};

export const COUNTRIES: Country[] = worldCountries
  .filter((item) => item.idd?.root && item.idd.suffixes?.length)
  .map((item) => ({
    id: item.cca2,
    dial: item.idd.root + (item.idd.suffixes.length === 1 ? item.idd.suffixes[0] : ""),
    fr: item.translations?.fra?.common ?? item.name.common,
    en: item.name.common,
    flag: item.flag,
    region: item.region,
  }))
  .sort((a, b) => regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region) || a.fr.localeCompare(b.fr, "fr"));

export const DEFAULT_COUNTRY = COUNTRIES.find((item) => item.id === "CA") ?? COUNTRIES[0];