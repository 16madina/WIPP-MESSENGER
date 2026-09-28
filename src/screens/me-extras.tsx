import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Clock, Copy, Download, Globe, ImagePlus, MapPin, MessageCircle, Monitor, Pencil, QrCode, Share2, Smartphone, Store, Tag } from "lucide-react";
import wippLogo from "@/assets/wipp-logo-gold.png.asset.json";
import { Avatar } from "@/components/avatar";
import { QrCard } from "@/components/qr-card";
import { SmartImg } from "@/components/smart-img";
import { Btn, Field, Header, IconBtn, Row, SearchField, Section, Sheet, StatusBar, Toggle } from "@/components/ui";
import { authHeaders, cardLink, type SavedBusinessCard, uploadBusinessImage } from "@/lib/business-card";
import { getMyBusinessCard, getPublicBusinessCard, saveMyBusinessCard } from "@/lib/business-card.functions";
import { providers } from "@/lib/providers";
import { CountryList } from "@/components/country-list";
import { COUNTRIES } from "@/lib/countries";
import { businessQr } from "@/lib/qr-resolver";
import { qrPngBlob } from "@/lib/qr";
import { useWgoStore } from "@/lib/store";

export function BusinessCardScreen() {
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const [card, setCard] = useState<SavedBusinessCard | null | undefined>(undefined);
  const [error, setError] = useState("");
  useEffect(() => { void (async () => {
    try { const result = await getMyBusinessCard({ headers: await authHeaders() } as never); setCard(result.card); }
    catch { setCard(null); setError("Connecte-toi pour créer ta carte professionnelle."); }
  })(); }, []);
  return (
    <div className="flex h-full flex-col bg-ink text-paper">
      <StatusBar />
      <Header title={card?.name || "Ma carte de visite"} onBack={pop} className="text-paper [&_button]:text-paper" />
      {card === undefined ? <div className="flex flex-1 items-center justify-center"><span className="size-7 animate-spin rounded-full border-2 border-paper/20 border-t-accent" /></div> : null}
      {card ? <BusinessCard card={card} owner onEdit={() => push({ name: "business-card-editor" })} /> : null}
      {card === null ? <BusinessIntro error={error} onCreate={() => push({ name: "business-card-editor" })} /> : null}
    </div>
  );
}

function BusinessIntro({ error, onCreate }: { error?: string; onCreate: () => void }) {
  const benefits = [
    [Camera, "Présente ton activité", "Photos, description, horaires…"],
    [QrCode, "Partage ton QR professionnel", "À imprimer ou à partager sur WIPP."],
    [MessageCircle, "Reçois des messages sur WIPP", "Les personnes te contactent directement."],
  ] as const;
  return <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8 pt-7">
    <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Store className="size-10" /></div>
    <h1 className="mt-7 text-[29px] font-semibold leading-[1.04]">Crée ta carte<br/><span className="text-accent">professionnelle</span></h1>
    <p className="mt-4 text-[15px] leading-relaxed text-paper/60">Fais découvrir ton activité sur WIPP et permets aux gens de te contacter sans partager ton numéro personnel.</p>
    <div className="mt-6 overflow-hidden rounded-2xl bg-navy ring-1 ring-paper/8">
      {benefits.map(([Icon, title, sub]) => <div key={title} className="flex min-h-[68px] items-center gap-3 border-b border-paper/8 px-4 last:border-0"><Icon className="size-5 shrink-0 text-accent"/><div><p className="text-[14px] font-medium">{title}</p><p className="mt-0.5 text-[12px] text-paper/50">{sub}</p></div></div>)}
    </div>
    {error ? <p className="mt-3 text-[12px] text-danger">{error}</p> : null}
    <Btn className="mt-5 w-full" onClick={onCreate}>Créer ma carte de visite <span aria-hidden>→</span></Btn>
  </div>;
}

type Draft = { name:string; category:string; description:string; country:string; city:string; address:string; showAddress:boolean; hours:string; businessPhone:string; website:string; coverPath:string|null; logoPath:string|null; photoPaths:string[]; coverUrl:string|null; logoUrl:string|null; photoUrls:string[] };
const emptyDraft: Draft = { name:"", category:"Mode & accessoires", description:"", country:"Canada", city:"", address:"", showAddress:false, hours:"", businessPhone:"", website:"", coverPath:null, logoPath:null, photoPaths:[], coverUrl:null, logoUrl:null, photoUrls:[] };

export function BusinessCardEditorScreen() {
  const pop = useWgoStore((s) => s.pop); const replace = useWgoStore((s) => s.replace);
  const [profileId, setProfileId] = useState(""); const [draft, setDraft] = useState<Draft>(emptyDraft); const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(true); const [error, setError] = useState(""); const [countryPicker, setCountryPicker] = useState(false);
  useEffect(() => { void (async () => { try { const r = await getMyBusinessCard({ headers: await authHeaders() } as never); setProfileId(r.profileId); if (r.userCountry && !r.card) setDraft((d) => ({ ...d, country: r.userCountry! })); if (r.card) setDraft({ name:r.card.name, category:r.card.category, description:r.card.description, country:r.card.country, city:r.card.city, address:r.card.address ?? "", showAddress:r.card.showAddress, hours:r.card.hours ?? "", businessPhone:r.card.businessPhone ?? "", website:r.card.website ?? "", coverPath:r.card.coverPath, logoPath:r.card.logoPath, photoPaths:r.card.photoPaths, coverUrl:r.card.coverUrl, logoUrl:r.card.logoUrl, photoUrls:r.card.photoUrls }); } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); } finally { setBusy(false); } })(); }, []);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  async function pick(file: File | undefined, role: "cover"|"logo"|"photo") { if (!file || !profileId) return; setBusy(true); try { const media = await uploadBusinessImage(profileId,file,role); if(role==="cover"){set("coverPath",media.path);set("coverUrl",media.url);} else if(role==="logo"){set("logoPath",media.path);set("logoUrl",media.url);} else {set("photoPaths",[...draft.photoPaths,media.path].slice(0,8));set("photoUrls",[...draft.photoUrls,media.url].slice(0,8));} } catch(e){setError(e instanceof Error?e.message:"Erreur");} finally{setBusy(false);} }
  async function save(){ setBusy(true); setError(""); try { await saveMyBusinessCard({ data:{ name:draft.name,category:draft.category,description:draft.description,country:draft.country,city:draft.city,address:draft.address||null,showAddress:draft.showAddress,hours:draft.hours||null,businessPhone:draft.businessPhone||null,website:draft.website||null,coverPath:draft.coverPath,logoPath:draft.logoPath,photoPaths:draft.photoPaths }, headers:await authHeaders() } as never); replace({name:"business-card"}); } catch(e){setError(e instanceof Error?e.message:"Enregistrement impossible");} finally{setBusy(false);} }
  if (busy && !profileId) return <div className="flex h-full items-center justify-center bg-ink"><span className="size-7 animate-spin rounded-full border-2 border-paper/20 border-t-accent" /></div>;
  if (preview) return <div className="flex h-full flex-col bg-ink text-paper"><StatusBar/><Header title="Aperçu" onBack={()=>setPreview(false)} className="text-paper [&_button]:text-paper"/><BusinessCard card={{...draft,id:"preview",publicId:"apercu",ownerProfileId:profileId,isPublished:false}} owner onEdit={()=>setPreview(false)} onSave={save}/></div>;
  return <div className="flex h-full flex-col bg-ink text-paper"><StatusBar/><Header title="Modifier ma carte" onBack={pop} right={<Btn className="h-9 min-h-9 rounded-full px-4 text-[13px]" disabled={!draft.name.trim()||!draft.city.trim()} onClick={()=>setPreview(true)}>Aperçu</Btn>} className="text-paper [&_button]:text-paper"/>
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
      <ImageInput label="Photo de couverture" value={draft.coverUrl} onPick={(f)=>void pick(f,"cover")} wide />
      <div className="mt-4"><ImageInput label="Logo ou photo professionnelle" value={draft.logoUrl} onPick={(f)=>void pick(f,"logo")} /></div>
      <div className="mt-4 grid gap-3"><Field label="Nom de l’activité *" value={draft.name} onChange={(e)=>set("name",e.target.value)}/>
        <label className="block"><span className="mb-1.5 block text-[12px] font-medium text-paper/60">Catégorie *</span><select value={draft.category} onChange={(e)=>set("category",e.target.value)} className="h-12 w-full rounded-md bg-navy px-4 text-[15px] outline-none ring-1 ring-paper/10">{["Mode & accessoires","Beauté","Coiffure","Restaurant","Services professionnels","Immobilier","Construction","Santé & bien-être","Créateur / média","Autre"].map(x=><option key={x}>{x}</option>)}</select></label>
        <Field label="Description" value={draft.description} onChange={(e)=>set("description",e.target.value)}/><div className="rounded-md bg-navy px-4 py-3 ring-1 ring-paper/10"><span className="mb-1 block text-[12px] font-medium text-paper/60">Pays *</span><div className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2 text-[15px]">{(()=>{const c=COUNTRIES.find((x)=>x.fr===draft.country);return c?<img src={c.flag} alt="" className="h-4 w-6 shrink-0 rounded-sm object-cover"/>:null})()}<span className="truncate">{draft.country}</span></span><button type="button" onClick={()=>setCountryPicker(true)} className="shrink-0 text-[13px] font-medium text-accent">Modifier le pays</button></div></div><Field label="Ville *" value={draft.city} onChange={(e)=>set("city",e.target.value)}/><Field label="Adresse (facultative)" value={draft.address} onChange={(e)=>set("address",e.target.value)}/>
        <div className="flex items-center justify-between rounded-xl bg-navy px-4 py-1 ring-1 ring-paper/8"><span className="text-[13px]">Publier l’adresse précise</span><Toggle checked={draft.showAddress} onChange={(v)=>set("showAddress",v)} /></div>
        <Field label="Horaires (facultatifs)" value={draft.hours} placeholder="Lun–Sam · 10 h–19 h" onChange={(e)=>set("hours",e.target.value)}/><Field label="Téléphone professionnel (facultatif)" value={draft.businessPhone} inputMode="tel" onChange={(e)=>set("businessPhone",e.target.value)}/><p className="-mt-2 text-[11px] text-paper/45">Ton numéro personnel WIPP n’est jamais utilisé.</p><Field label="Site web (facultatif)" value={draft.website} placeholder="www.monactivite.ca" onChange={(e)=>set("website",e.target.value)}/>
      </div>
      <div className="mt-5"><p className="mb-2 text-[12px] text-paper/60">Photos de l’activité · {draft.photoUrls.length}/8</p><div className="flex gap-2 overflow-x-auto">{draft.photoUrls.map((url,i)=><SmartImg key={url} src={url} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover"/>)}{draft.photoUrls.length<8?<ImageInput label="Ajouter" onPick={(f)=>void pick(f,"photo")} compact/>:null}</div></div>
{error?<p className="mt-4 text-[12px] text-danger">{error}</p>:null}<Btn className="mt-6 w-full" disabled={busy||!draft.name.trim()||!draft.city.trim()} onClick={()=>void save()}>{busy?"Enregistrement…":"Enregistrer"}</Btn>
    </div>
    <Sheet open={countryPicker} onClose={()=>setCountryPicker(false)} title="Choisir un pays"><CountryList onPick={(c)=>{set("country",c.fr);setCountryPicker(false);}}/></Sheet>
    </div>;
}

function ImageInput({label,value,onPick,wide,compact}:{label:string;value?:string|null;onPick:(file:File|undefined)=>void;wide?:boolean;compact?:boolean}){ const ref=useRef<HTMLInputElement>(null); return <><input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e)=>onPick(e.target.files?.[0])}/><button type="button" onClick={()=>ref.current?.click()} className={wide?"relative h-36 w-full overflow-hidden rounded-2xl bg-navy ring-1 ring-paper/10":compact?"flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-navy ring-1 ring-paper/10":"relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-navy ring-2 ring-accent"}>{value?<SmartImg src={value} alt="" className="size-full object-cover"/>:<ImagePlus className="size-6 text-accent"/>}<span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[10px] text-paper">{label}</span></button></> }

export function BusinessCardViewScreen({ publicId }: { publicId: string }) { const pop=useWgoStore((s)=>s.pop); const [card,setCard]=useState<SavedBusinessCard|null|undefined>(); useEffect(()=>{void getPublicBusinessCard({data:{publicId}}).then(setCard).catch(()=>setCard(null));},[publicId]); return <div className="flex h-full flex-col bg-ink text-paper"><StatusBar/><Header title={card?.name || "Carte professionnelle"} onBack={pop} className="text-paper [&_button]:text-paper"/>{card?<BusinessCard card={card}/>:card===null?<p className="px-6 pt-10 text-center text-paper/60">Cette carte n’est pas disponible.</p>:null}</div> }

function BusinessCard({card,owner,onEdit,onSave}:{card:SavedBusinessCard;owner?:boolean;onEdit?:()=>void;onSave?:()=>void}) { const push=useWgoStore((s)=>s.push); const users=useWgoStore((s)=>s.users); const chats=useWgoStore((s)=>s.chats); const sendMessage=useWgoStore((s)=>s.sendMessage); const [share,setShare]=useState(false); const [q,setQ]=useState(""); const link=cardLink(card.publicId); const qr=businessQr(card.publicId); const contacts=useMemo(()=>chats.filter(c=>c.type==="dm").map(c=>{const id=c.participantIds.find(x=>x!=="me");return id?{chat:c,user:users[id]}:null}).filter((x):x is NonNullable<typeof x>=>Boolean(x?.user)).filter(x=>`${x.user.displayName} ${x.user.username}`.toLowerCase().includes(q.toLowerCase())).slice(0,8),[chats,users,q]);
  const openBusinessChat=useWgoStore((s)=>s.openBusinessChat); const [opening,setOpening]=useState(false);
  const writeOnWipp=async()=>{setOpening(true);setActionError(null);try{await openBusinessChat(card.publicId);}catch(e){setActionError(e instanceof Error?e.message:"Impossible d’ouvrir la conversation");}finally{setOpening(false);}};
  const shareTo=(chatId:string)=>{sendMessage(chatId,{type:"shop",text:card.name,shopId:`business:${card.publicId}`});setShare(false);};
  const [actionError,setActionError]=useState("");
  async function downloadQr(){setActionError("");try{const blob=await qrPngBlob(qr,960);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`wipp-qr-${card.publicId}.png`;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);}catch{setActionError("Impossible de télécharger le QR pour le moment.");}}
  async function shareNative(){setActionError("");const result=await providers.share.share({title:card.name,text:`Découvre ${card.name} sur WIPP`,url:link});if(result==="failed")setActionError("Impossible de partager cette carte pour le moment.");}
  return <div className="relative flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 overflow-y-auto"><div className="relative h-40 bg-navy">{card.coverUrl?<SmartImg src={card.coverUrl} alt="" className="size-full object-cover"/>:<div className="flex size-full items-center justify-center"><Store className="size-12 text-accent/60"/></div>}</div><div className="px-4 pb-5"><div className="relative -mt-6 flex items-end gap-3">{card.logoUrl?<SmartImg src={card.logoUrl} alt="" className="size-18 shrink-0 rounded-full object-cover ring-2 ring-accent"/>:<div className="flex size-18 shrink-0 items-center justify-center rounded-full bg-navy text-2xl font-semibold text-accent ring-2 ring-accent">{card.name.slice(0,2).toUpperCase()}</div>}<div className="min-w-0 pb-1"><h1 className="break-words text-[20px] font-semibold">{card.name}</h1><p className="text-[12px] text-paper/55">{card.category}</p></div></div><div className="mt-5 space-y-2">{card.address?<Info icon={MapPin}>{card.address}<br/>{card.city}, {card.country}</Info>:<Info icon={MapPin}>{card.city}, {card.country}</Info>}{card.hours?<Info icon={Clock}>{card.hours}</Info>:null}{card.website?<Info icon={Globe}>{card.website}</Info>:null}</div>{card.description?<p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-paper/80">{card.description}</p>:null}
    {card.photoUrls.length?<div className="mt-4 flex gap-2 overflow-x-auto">{card.photoUrls.map(url=><SmartImg key={url} src={url} alt="" className="h-20 w-24 shrink-0 rounded-md object-cover"/>)}</div>:null}
    <div className="mt-5 flex items-center gap-3 border-t border-paper/10 pt-4"><div className="shrink-0"><QrCard value={qr} size={124} pad={5} markSrc={card.logoUrl??undefined}/></div><div className="flex min-w-0 flex-col items-start"><p className="break-words text-[13px] font-medium">Scanner pour découvrir ma carte sur WIPP.</p><img src={wippLogo.url} alt="WIPP" className="mt-3 h-12 w-auto max-w-full object-contain" /></div></div></div></div>
    <div className="shrink-0 border-t border-paper/10 bg-ink px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">{actionError?<p role="alert" className="mb-2 text-[12px] text-danger">{actionError}</p>:null}<div className={owner&&!onSave?"grid grid-cols-3 gap-2":"grid grid-cols-2 gap-2"}>{onSave?<Btn className="col-span-2" onClick={onSave}>Enregistrer cette carte</Btn>:owner?<><Btn variant="secondary" className="gap-1 px-1 text-[12px]" onClick={onEdit}><Pencil className="size-4 shrink-0"/>Modifier</Btn><Btn variant="secondary" className="gap-1 px-1 text-[12px]" onClick={()=>void shareNative()}><Share2 className="size-4 shrink-0"/>Partager</Btn><Btn variant="secondary" className="gap-1 px-1 text-[12px]" onClick={()=>void downloadQr()}><Download className="size-4 shrink-0"/>Télécharger</Btn></>:<><Btn disabled={opening} onClick={()=>void writeOnWipp()}><MessageCircle className="size-4"/>{opening?"Ouverture…":"Écrire sur WIPP"}</Btn><Btn variant="secondary" onClick={()=>setShare(true)}><Share2 className="size-4"/>Partager</Btn></>}</div></div>
    <Sheet open={share} onClose={()=>setShare(false)} title="Partager ma carte"><SearchField value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher un contact"/><div className="mt-3 flex gap-3 overflow-x-auto">{contacts.slice(0,5).map(({chat,user})=><button key={chat.id} type="button" className="w-14 shrink-0 text-center" onClick={()=>shareTo(chat.id)}><Avatar user={user} size={46}/><span className="mt-1 block truncate text-[10px]">{user.firstName}</span></button>)}</div><div className="mt-4 overflow-hidden rounded-xl bg-surface-2"><ShareRow icon={MessageCircle} label="Partager sur WIPP" onClick={()=>{}}/><ShareRow icon={Copy} label="Copier le lien de ma carte" onClick={()=>void navigator.clipboard.writeText(link)}/><ShareRow icon={QrCode} label="Partager le QR" onClick={()=>void providers.share.share({title:card.name,text:"QR professionnel WIPP",url:qr})}/><ShareRow icon={Share2} label="Partager ailleurs" onClick={()=>void providers.share.share({title:card.name,text:`Découvre ${card.name} sur WIPP`,url:link})}/></div></Sheet>
  </div>;
}
function Info({icon:Icon,children}:{icon:typeof MapPin;children:React.ReactNode}){return <div className="flex gap-2 text-[12px] text-paper/75"><Icon className="mt-0.5 size-4 shrink-0 text-accent"/><span>{children}</span></div>}
function ShareRow({icon:Icon,label,onClick}:{icon:typeof Share2;label:string;onClick:()=>void}){return <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center gap-3 border-b border-hair px-3 text-left last:border-0"><Icon className="size-5 text-accent"/><span className="text-[14px]">{label}</span></button>}

/** Appareils connectés — architecture prête, révocation non disponible tant que le serveur ne la gère pas. */
export function DevicesScreen() {
  const pop = useWgoStore((s) => s.pop);
  const mobile = typeof navigator !== "undefined" && /iPhone|Android/i.test(navigator.userAgent);
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Appareils" onBack={pop} />
      <div className="mt-4">
        <Section title="Cet appareil">
          <Row
            icon={mobile ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
            label={mobile ? "Téléphone" : "Navigateur web"}
            value="Actif"
          />
        </Section>
      </div>
      <p className="px-6 pt-3 text-[13px] leading-relaxed text-muted">
        La liste des autres appareils et la déconnexion à distance arriveront avec l'app native.
      </p>
    </div>
  );
}

const LANGS: { id: "fr" | "en"; label: string; ready: boolean }[] = [
  { id: "fr", label: "Français", ready: true },
  { id: "en", label: "English", ready: false },
];

/** Langue — structure de sélection ; seule la traduction française est complète. */
export function LanguageScreen() {
  const pop = useWgoStore((s) => s.pop);
  const language = useWgoStore((s) => s.language);
  const setLanguage = useWgoStore((s) => s.setLanguage);
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title="Langue" onBack={pop} />
      <div className="mt-4">
        <Section title="Langue de l'app">
          {LANGS.map((l) => (
            <Row
              key={l.id}
              label={l.ready ? l.label : `${l.label} (partielle)`}
              trailing={language === l.id ? <Check className="size-4 text-accent" /> : undefined}
              onClick={() => setLanguage(l.id)}
            />
          ))}
        </Section>
      </div>
      <p className="px-6 pt-3 text-[13px] leading-relaxed text-muted">
        WIPP est entièrement en français. La traduction anglaise n'est pas encore complète.
      </p>
    </div>
  );
}
