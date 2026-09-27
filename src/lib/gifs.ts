/**
 * Bibliothèque GIF locale (sur l’appareil). Aucun fournisseur externe n’est
 * branché : l’utilisateur importe ses GIF, ils restent dans le téléphone.
 */
const KEY = "wipp-gifs-v1";
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_ITEMS = 24;

export type LocalGif = { id: string; url: string; addedAt: number };

export function loadGifs(): LocalGif[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalGif[]) : [];
  } catch {
    return [];
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export async function addGif(file: File): Promise<LocalGif> {
  if (file.type !== "image/gif") throw new Error("not-gif");
  if (file.size > MAX_BYTES) throw new Error("too-big");
  const url = await readAsDataUrl(file);
  const gif: LocalGif = { id: `gif-${Date.now()}`, url, addedAt: Date.now() };
  const next = [gif, ...loadGifs()].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* plein : le GIF reste utilisable pour cet envoi */
  }
  return gif;
}
