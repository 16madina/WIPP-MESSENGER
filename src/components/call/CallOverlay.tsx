import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import {
  Camera,
  ChevronDown,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  MoreHorizontal,
  Phone,
  PhoneOff,
  RotateCcw,
  Search,
  SwitchCamera,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { callEngine, useCall } from "@/lib/calls/engine";
import type { CallParticipant, CallState, ParticipantState } from "@/lib/calls/types";
import { formatDuration } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useWgoStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ============================ Aides ============================ */

const face = (u?: User) => (u ? { displayName: u.displayName, avatar: u.avatar } : undefined);

function remoteVideoSrc(u?: User) {
  const m = u?.avatar?.match(/\/avatars\/([^/.]+)\.\w+$/);
  return m ? `/calls/${m[1]}.mp4` : "";
}

function useElapsed(since?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [since]);
  return since ? Math.max(0, (now - since) / 1000) : 0;
}

function clock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function longDuration(sec?: number) {
  if (!sec || sec < 1) return "";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

const TERMINAL = ["ended", "declined", "missed", "busy", "failed"] as const;
const isTerminal = (s: CallState["status"]) => (TERMINAL as readonly string[]).includes(s);

function statusLabel(c: CallState, elapsed: number) {
  switch (c.status) {
    case "outgoing":
      return "Appel…";
    case "ringing":
      return c.dir === "in" ? (c.media === "video" ? "Appel vidéo WIPP" : "Appel audio WIPP") : "Ça sonne…";
    case "connecting":
      return "Connexion…";
    case "connected":
      return clock(elapsed);
    case "reconnecting":
      return "Reconnexion…";
    case "ended":
      return "Appel terminé";
    case "declined":
      return "Appel refusé";
    case "missed":
      return c.dir === "in" ? "Appel manqué" : "Pas de réponse";
    case "busy":
      return "Occupé";
    case "failed":
      return c.endReason === "lost" ? "Connexion perdue" : "Connexion impossible";
    default:
      return "";
  }
}

const PART_LABEL: Record<ParticipantState, string> = {
  invited: "Invitation envoyée",
  ringing: "Ça sonne…",
  connecting: "Connexion…",
  connected: "Connecté",
  left: "A quitté",
  declined: "Refusé",
  disconnected: "Déconnecté",
};

/* ============================ Racine ============================ */

export function CallOverlay() {
  const c = useCall();
  if (c.permission) return <PermissionScreen />;
  if (c.status === "idle") return null;
  if (c.minimized && !isTerminal(c.status)) return <MiniCall />;
  return <FullCall />;
}

/* ============================ Écran plein ============================ */

function FullCall() {
  const c = useCall();
  const users = useWgoStore((s) => s.users);
  const elapsed = useElapsed(c.connectedAt);
  const [sheet, setSheet] = useState<null | "add" | "participants" | "more" | "reply">(null);
  const [chrome, setChrome] = useState(true);
  const lead = users[c.participants[0]?.id ?? ""];
  const title = c.group ? c.title || c.participants.map((p) => users[p.id]?.firstName).filter(Boolean).join(", ") : lead?.displayName;
  const live = c.status === "connected" || c.status === "reconnecting";
  const incoming = c.status === "ringing" && c.dir === "in";
  const videoStage = live && c.media === "video";
  const label = statusLabel(c, elapsed);

  useEffect(() => {
    if (!videoStage || !chrome) return;
    const id = window.setTimeout(() => setChrome(false), 5000);
    return () => window.clearTimeout(id);
  }, [videoStage, chrome]);

  useEffect(() => {
    if (c.status === "connected") haptic("success");
  }, [c.status]);

  return (
    <div className="call-root absolute inset-0 z-[70] flex flex-col overflow-hidden bg-navy text-paper">
      {/* Halo discret tiré de la photo */}
      {!videoStage && lead?.avatar ? (
        <img src={lead.avatar} alt="" aria-hidden className="call-halo pointer-events-none absolute inset-0 size-full object-cover" />
      ) : null}

      {videoStage ? (
        c.group ? (
          <GroupVideoGrid onTap={() => setChrome((v) => !v)} />
        ) : (
          <OneVideoStage onTap={() => setChrome((v) => !v)} />
        )
      ) : null}

      <div className={cn("relative z-10 flex h-full flex-col", videoStage && "pointer-events-none")}>
        <div className="h-[env(safe-area-inset-top,0px)] min-h-11" />
        {/* Barre du haut */}
        <div
          className={cn(
            "pointer-events-auto flex items-center justify-between px-2 transition-opacity duration-300",
            videoStage && !chrome && "opacity-0",
          )}
        >
          {!incoming && !isTerminal(c.status) ? (
            <button type="button" className="press hit flex items-center gap-1 px-2 text-paper/85" onClick={() => callEngine.minimize()} aria-label="Réduire l’appel">
              <ChevronDown className="size-6" />
            </button>
          ) : (
            <span className="size-11" />
          )}
          <div className="min-w-0 text-center">
            {videoStage ? (
              <>
                <p className="truncate text-[15px] font-semibold">{title}</p>
                <p className="text-[12px] tabular-nums text-paper/70">{label}</p>
              </>
            ) : null}
          </div>
          {c.group && live ? (
            <button type="button" className="press hit flex items-center justify-center px-2 text-paper/85" onClick={() => setSheet("participants")} aria-label="Participants">
              <Users className="size-5" />
            </button>
          ) : (
            <span className="size-11" />
          )}
        </div>

        <QualityPill />

        {/* Centre */}
        {videoStage ? (
          <div className="flex-1" />
        ) : c.group && live ? (
          <GroupAudioStage />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="relative">
              {c.status === "outgoing" || c.status === "ringing" ? (
                <>
                  <span className="call-wave absolute inset-[-14px] rounded-full" />
                  <span className="call-wave absolute inset-[-14px] rounded-full [animation-delay:0.9s]" />
                </>
              ) : null}
              <span className={cn("call-face block rounded-full", live && !c.group && c.speakingId === lead?.id && "is-speaking")}>
                {c.group ? <GroupFaces ids={c.participants.map((p) => p.id)} /> : <Avatar user={face(lead)} size={132} />}
              </span>
            </div>
            <h1 className="mt-7 max-w-full truncate text-[26px] font-semibold tracking-tight">{title}</h1>
            {!c.group && lead ? <p className="mt-0.5 text-[14px] text-paper/50">@{lead.username}</p> : null}
            <p
              className={cn(
                "mt-3 text-[15px] tabular-nums",
                c.status === "connected" ? "text-paper/80" : "text-paper/60",
                (c.status === "failed" || c.status === "busy" || c.status === "declined" || c.status === "missed") && "text-paper",
              )}
            >
              {c.status === "reconnecting" ? <span className="call-dots">Reconnexion</span> : label}
            </p>
            {c.status === "ended" && c.duration ? <p className="mt-1 text-[13px] text-paper/55">{longDuration(c.duration)}</p> : null}
            {live && c.muted ? <p className="mt-2 text-[12px] text-accent">Ton micro est coupé</p> : null}
            {c.micDenied && !isTerminal(c.status) ? (
              <p className="mt-2 max-w-[30ch] text-center text-[12px] text-paper/50">Micro non autorisé : l’autre personne ne t’entend pas.</p>
            ) : null}
          </div>
        )}

        {/* Bas */}
        <div
          className={cn(
            "pointer-events-auto px-5 pb-[max(28px,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300",
            videoStage && !chrome && "pointer-events-none translate-y-6 opacity-0",
          )}
        >
          {incoming ? (
            <IncomingActions onReply={() => setSheet("reply")} />
          ) : isTerminal(c.status) ? (
            <OutcomeActions />
          ) : (
            <Controls onAdd={() => setSheet("add")} onMore={() => setSheet("more")} />
          )}
        </div>
      </div>

      {c.status === "reconnecting" ? (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center">
          <span className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-[13px] text-fg">
            <span className="call-spinner size-3.5 rounded-full" /> Reconnexion…
          </span>
        </div>
      ) : null}

      {c.videoAsk ? <VideoAskDialog /> : null}
      <InCallSheet open={sheet === "add"} title="Ajouter à l’appel" onClose={() => setSheet(null)}>
        <AddPeople onDone={() => setSheet(null)} />
      </InCallSheet>
      <InCallSheet open={sheet === "participants"} title="Participants" onClose={() => setSheet(null)}>
        <ParticipantsList onAdd={() => setSheet("add")} />
      </InCallSheet>
      <InCallSheet open={sheet === "more"} title="Plus" onClose={() => setSheet(null)}>
        <MoreMenu onClose={() => setSheet(null)} />
      </InCallSheet>
      <InCallSheet open={sheet === "reply"} title="Répondre par message" onClose={() => setSheet(null)}>
        <div className="flex flex-col gap-2 pb-2">
          {["Je te rappelle.", "Je ne peux pas parler maintenant.", "Dans 5 minutes."].map((txt) => (
            <button key={txt} type="button" className="press min-h-12 rounded-2xl bg-surface-2 px-4 text-left text-[15px]" onClick={() => callEngine.decline(txt)}>
              {txt}
            </button>
          ))}
        </div>
      </InCallSheet>
    </div>
  );
}

function GroupFaces({ ids }: { ids: string[] }) {
  const users = useWgoStore((s) => s.users);
  const shown = ids.slice(0, 3);
  return (
    <span className="relative block size-[132px]">
      {shown.map((id, i) => (
        <span
          key={id}
          className="absolute rounded-full ring-4 ring-navy"
          style={{ left: [8, 58, 30][i], top: [18, 18, 64][i] }}
        >
          <Avatar user={face(users[id])} size={66} />
        </span>
      ))}
    </span>
  );
}

/* ============================ Contrôles ============================ */

function CtrlBtn({
  label,
  active,
  danger,
  onClick,
  children,
  disabled,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      onClick={() => {
        haptic("tap");
        onClick();
      }}
      className="press flex flex-col items-center gap-1.5 disabled:opacity-35"
    >
      <span
        className={cn(
          "flex size-[58px] items-center justify-center rounded-full transition-colors duration-200",
          danger ? "bg-danger text-paper" : active ? "bg-paper text-navy" : "bg-paper/12 text-paper backdrop-blur-xl",
        )}
      >
        {children}
      </span>
      <span className="text-[11px] font-medium text-paper/70">{label}</span>
    </button>
  );
}

function Controls({ onAdd, onMore }: { onAdd: () => void; onMore: () => void }) {
  const c = useCall();
  const live = c.status === "connected" || c.status === "reconnecting";
  const video = c.media === "video";
  const mic = (
    <CtrlBtn label="Micro" active={c.muted} onClick={() => callEngine.toggleMute()}>
      {c.muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
    </CtrlBtn>
  );
  const speaker = (
    <CtrlBtn label="Haut-parleur" active={c.speaker} onClick={() => callEngine.toggleSpeaker()}>
      {c.speaker ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
    </CtrlBtn>
  );
  const cam = (
    <CtrlBtn label="Caméra" active={video ? c.camOff : false} onClick={() => void callEngine.toggleCamera()}>
      {video && c.camOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
    </CtrlBtn>
  );
  const hang = (
    <CtrlBtn label="Raccrocher" danger onClick={() => callEngine.hangup()}>
      <PhoneOff className="size-6" />
    </CtrlBtn>
  );
  const add = (
    <CtrlBtn label="Ajouter" onClick={onAdd} disabled={!live}>
      <UserPlus className="size-6" />
    </CtrlBtn>
  );
  const more = (
    <CtrlBtn label="Plus" onClick={onMore} disabled={!live}>
      <MoreHorizontal className="size-6" />
    </CtrlBtn>
  );

  if (!live) {
    // Pendant l'appel sortant : micro, haut-parleur, vidéo, raccrocher.
    return <div className="grid grid-cols-4 gap-3">{mic}{speaker}{cam}{hang}</div>;
  }
  if (video) {
    const flip = (
      <CtrlBtn label="Changer" onClick={() => callEngine.flipCamera()} disabled={c.camOff}>
        <SwitchCamera className="size-6" />
      </CtrlBtn>
    );
    return (
      <div className="glass-call rounded-[32px] px-3 pt-4 pb-3">
        <div className="grid grid-cols-3 gap-y-4">{mic}{cam}{flip}{speaker}{c.group ? add : more}{hang}</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-y-5">
      {mic}
      {speaker}
      {c.group ? add : cam}
      {c.group ? more : add}
      {c.group ? cam : more}
      {hang}
    </div>
  );
}

function IncomingActions({ onReply }: { onReply: () => void }) {
  const c = useCall();
  return (
    <div className="flex flex-col items-center gap-6">
      <button type="button" className="press flex items-center gap-2 rounded-full bg-paper/10 px-4 py-2 text-[13px] text-paper/85" onClick={onReply}>
        <MessageSquare className="size-4" /> Répondre par message
      </button>
      <div className="flex w-full items-start justify-around">
        <CtrlBtn label="Refuser" danger onClick={() => callEngine.decline()}>
          <PhoneOff className="size-6" />
        </CtrlBtn>
        {c.media === "video" ? (
          <CtrlBtn label="Audio seul" onClick={() => void callEngine.accept(false)}>
            <Phone className="size-6" />
          </CtrlBtn>
        ) : null}
        <button type="button" className="press flex flex-col items-center gap-1.5" onClick={() => void callEngine.accept(c.media === "video")} aria-label="Accepter">
          <span className="call-accept flex size-[58px] items-center justify-center rounded-full bg-accent text-accent-fg">
            {c.media === "video" ? <Video className="size-6" /> : <Phone className="size-6" />}
          </span>
          <span className="text-[11px] font-medium text-paper/70">{c.media === "video" ? "Accepter en vidéo" : "Accepter"}</span>
        </button>
      </div>
    </div>
  );
}

function OutcomeActions() {
  const c = useCall();
  const [ready, setReady] = useState(c.status === "ended");
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 1100);
    return () => window.clearTimeout(id);
  }, []);
  if (c.status === "ended") {
    return (
      <div className="flex justify-center">
        <button type="button" className="press min-h-11 rounded-full bg-paper/10 px-6 text-[14px]" onClick={() => callEngine.close()}>
          Fermer
        </button>
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-3 gap-3 transition-opacity duration-300", ready ? "opacity-100" : "pointer-events-none opacity-0")}>
      <CtrlBtn label="Rappeler" onClick={() => callEngine.redial()}>
        <RotateCcw className="size-6" />
      </CtrlBtn>
      <CtrlBtn label="Message" onClick={() => callEngine.openChat()}>
        <MessageSquare className="size-6" />
      </CtrlBtn>
      <CtrlBtn label="Fermer" onClick={() => callEngine.close()}>
        <X className="size-6" />
      </CtrlBtn>
    </div>
  );
}

function QualityPill() {
  const q = useCall((s) => s.quality);
  const media = useCall((s) => s.media);
  const [showReduced, setShowReduced] = useState(false);
  useEffect(() => {
    if (q !== "reduced") return;
    setShowReduced(true);
    const id = window.setTimeout(() => setShowReduced(false), 4000);
    return () => window.clearTimeout(id);
  }, [q]);
  if (q === "good" && !showReduced) return null;
  return (
    <div className="pointer-events-none flex flex-col items-center gap-1.5 pt-1">
      {q !== "good" ? (
        <span className="flex items-center gap-1.5 rounded-full bg-ink/60 px-3 py-1 text-[12px] text-paper/85">
          <WifiOff className="size-3.5 text-accent" /> Connexion instable
        </span>
      ) : null}
      {showReduced && media === "video" ? (
        <span className="rounded-full bg-ink/60 px-3 py-1 text-[12px] text-paper/70">La qualité vidéo a été réduite.</span>
      ) : null}
    </div>
  );
}

/* ============================ Vidéo 1:1 ============================ */

function RemoteTile({ p, big, onTap }: { p: CallParticipant; big?: boolean; onTap?: () => void }) {
  const u = useWgoStore((s) => s.users[p.id]);
  const [broken, setBroken] = useState(false);
  const src = remoteVideoSrc(u);
  const show = p.state === "connected" && !p.camOff && src && !broken;
  return (
    <div className="relative size-full overflow-hidden bg-ink" onClick={onTap}>
      {show ? (
        <video src={src} autoPlay muted loop playsInline onError={() => setBroken(true)} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy">
          {u?.avatar ? <img src={u.avatar} alt="" aria-hidden className="call-halo absolute inset-0 size-full object-cover" /> : null}
          <span className="relative">
            <Avatar user={face(u)} size={big ? 112 : 56} />
          </span>
          {big ? <p className="relative text-[17px] font-semibold">{u?.displayName}</p> : null}
          <p className="relative text-[12px] text-paper/55">
            {p.state === "connected" ? (p.camOff ? "Caméra désactivée" : "") : PART_LABEL[p.state]}
          </p>
        </div>
      )}
    </div>
  );
}

function SelfView({ small }: { small?: boolean }) {
  const camOff = useCall((s) => s.camOff);
  const facing = useCall((s) => s.facing);
  const me = useWgoStore((s) => s.me);
  const ref = useRef<HTMLVideoElement>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (camOff || typeof window === "undefined" || localStorage.getItem("wipp.perm.camera") !== "granted") return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (ref.current) {
          ref.current.srcObject = s;
          void ref.current.play().catch(() => undefined);
        }
        setOk(true);
      })
      .catch(() => setOk(false));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      setOk(false);
    };
  }, [camOff, facing]);
  return (
    <div className="relative size-full overflow-hidden bg-ink">
      {!camOff ? (
        <video ref={ref} muted playsInline autoPlay className={cn("absolute inset-0 size-full object-cover", facing === "user" && "-scale-x-100", !ok && "opacity-0")} />
      ) : null}
      {camOff || !ok ? (
        <div className="absolute inset-0 flex items-center justify-center bg-navy">
          {camOff ? <Avatar user={{ displayName: me.displayName, avatar: me.avatar }} size={small ? 44 : 72} /> : me.avatar ? <img src={me.avatar} alt="" className="size-full object-cover opacity-80" /> : null}
        </div>
      ) : null}
    </div>
  );
}

type Corner = "tl" | "tr" | "bl" | "br";

/** Fenêtre flottante déplaçable qui se range dans le coin le plus proche. */
function CornerFloat({
  w,
  h,
  initial = "tr",
  inset = { top: 96, bottom: 200 },
  onTap,
  children,
  className,
}: {
  w: number;
  h: number;
  initial?: Corner;
  inset?: { top: number; bottom: number };
  onTap?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const [corner, setCorner] = useState<Corner>(initial);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ id: number; x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const pos = (c: Corner, hw: number, hh: number) => ({
    x: c.endsWith("l") ? 12 : hw - w - 12,
    y: c.startsWith("t") ? inset.top : hh - h - inset.bottom,
  });
  const size = () => ({ hw: host.current?.clientWidth ?? 390, hh: host.current?.clientHeight ?? 780 });
  const { hw, hh } = size();
  const p = drag ?? pos(corner, hw, hh);

  function down(e: RPointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    const s = size();
    const cur = pos(corner, s.hw, s.hh);
    start.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: cur.x, oy: cur.y, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthétique */
    }
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    const d = start.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && dx * dx + dy * dy < 49) return;
    d.moved = true;
    setDrag({ x: d.ox + dx, y: d.oy + dy });
  }
  function up(e: RPointerEvent<HTMLDivElement>) {
    const d = start.current;
    start.current = null;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      setDrag(null);
      onTap?.();
      return;
    }
    const s = size();
    const cx = (drag?.x ?? d.ox) + w / 2;
    const cy = (drag?.y ?? d.oy) + h / 2;
    setCorner(`${cy < s.hh / 2 ? "t" : "b"}${cx < s.hw / 2 ? "l" : "r"}` as Corner);
    setDrag(null);
    haptic("select");
  }

  return (
    <div ref={host} className="pointer-events-none absolute inset-0">
      <div
        className={cn("pointer-events-auto absolute touch-none", !drag && "transition-transform duration-300 ease-[cubic-bezier(.2,.9,.25,1.15)]", className)}
        style={{ width: w, height: h, transform: `translate3d(${p.x}px, ${p.y}px, 0)`, touchAction: "none" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          start.current = null;
          setDrag(null);
        }}
      >
        {children}
      </div>
    </div>
  );
}

function OneVideoStage({ onTap }: { onTap: () => void }) {
  const p = useCall((s) => s.participants[0]);
  if (!p) return null;
  return (
    <div className="absolute inset-0">
      <RemoteTile p={p} big onTap={onTap} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink/80 to-transparent" />
      <div className="absolute inset-0 z-20 pointer-events-none">
        <CornerFloat w={104} h={152} className="overflow-hidden rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,.45)] outline outline-1 outline-white/20">
          <SelfView small />
        </CornerFloat>
      </div>
    </div>
  );
}

/* ============================ Groupe ============================ */

function GroupAudioStage() {
  const c = useCall();
  const users = useWgoStore((s) => s.users);
  const elapsed = useElapsed(c.connectedAt);
  const people = c.participants.filter((p) => p.state !== "left" && p.state !== "declined");
  const all = [{ id: "me", state: "connected" as const, muted: c.muted, camOff: true }, ...people];
  const me = useWgoStore((s) => s.me);
  return (
    <div className="flex flex-1 flex-col px-5">
      <div className="pt-3 text-center">
        <h1 className="truncate text-[22px] font-semibold">{c.title || "Appel de groupe"}</h1>
        <p className="text-[13px] tabular-nums text-paper/60">
          {c.status === "reconnecting" ? "Reconnexion…" : `${clock(elapsed)} · ${people.filter((p) => p.state === "connected").length + 1} participants`}
        </p>
      </div>
      <div className="no-scrollbar mt-6 grid flex-1 content-center grid-cols-2 gap-x-4 gap-y-6 overflow-y-auto">
        {all.map((p) => {
          const u = p.id === "me" ? { displayName: me.displayName, avatar: me.avatar, firstName: "Moi" } : users[p.id];
          const speaking = c.speakingId === p.id && p.state === "connected" && !p.muted;
          return (
            <div key={p.id} className="flex flex-col items-center">
              <span className={cn("call-face relative rounded-full", speaking && "is-speaking", p.state !== "connected" && "opacity-50")}>
                <Avatar user={u ? { displayName: u.displayName, avatar: u.avatar } : undefined} size={84} />
                {p.muted ? (
                  <span className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full bg-navy ring-2 ring-navy">
                    <MicOff className="size-3.5 text-paper/80" />
                  </span>
                ) : null}
              </span>
              <p className="mt-2 max-w-full truncate text-[14px] font-medium">{p.id === "me" ? "Moi" : u?.firstName}</p>
              <p className="text-[11px] text-paper/50">{p.state === "connected" ? (p.muted ? "Micro coupé" : speaking ? "Parle" : "") : PART_LABEL[p.state]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupVideoGrid({ onTap }: { onTap: () => void }) {
  const c = useCall();
  const people = c.participants.filter((p) => p.state !== "left" && p.state !== "declined");
  const n = people.length + 1;
  const cols = n <= 2 ? 1 : 2;
  const rows = n <= 2 ? n : n <= 4 ? 2 : Math.ceil(n / 2);
  return (
    <div className="absolute inset-0 bg-ink pt-24 pb-44" onClick={onTap}>
      <div
        className="no-scrollbar grid size-full gap-1.5 overflow-y-auto px-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: n > 4 ? "minmax(180px, 1fr)" : `${100 / rows}%` }}
      >
        <Tile speaking={false} name="Moi" muted={c.muted}>
          <SelfView />
        </Tile>
        {people.map((p) => (
          <GroupTile key={p.id} p={p} speaking={c.speakingId === p.id} />
        ))}
      </div>
    </div>
  );
}

function GroupTile({ p, speaking }: { p: CallParticipant; speaking: boolean }) {
  const u = useWgoStore((s) => s.users[p.id]);
  return (
    <Tile speaking={speaking && p.state === "connected" && !p.muted} name={u?.firstName ?? ""} muted={p.muted}>
      <RemoteTile p={p} />
    </Tile>
  );
}

function Tile({ speaking, name, muted, children }: { speaking: boolean; name: string; muted: boolean; children: ReactNode }) {
  return (
    <div className={cn("call-tile relative overflow-hidden rounded-2xl", speaking && "is-speaking")}>
      {children}
      <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-ink/60 px-2 py-0.5 text-[11px] text-paper">
        {muted ? <MicOff className="size-3" /> : null}
        {name}
      </span>
    </div>
  );
}

/* ============================ Feuilles ============================ */

function InCallSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className={cn("absolute inset-0 z-40", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-ink/50 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className={cn(
          "glass-strong absolute inset-x-0 bottom-0 max-h-[70%] rounded-t-[28px] px-4 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] text-fg transition-transform duration-300 ease-[cubic-bezier(.2,.9,.25,1)]",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted/40" />
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button type="button" className="hit flex items-center justify-center text-muted" onClick={onClose} aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        {open ? children : null}
      </div>
    </div>
  );
}

function AddPeople({ onDone }: { onDone: () => void }) {
  const users = useWgoStore((s) => s.users);
  const blocked = useWgoStore((s) => s.blockedIds);
  const parts = useCall((s) => s.participants);
  const [q, setQ] = useState("");
  const inCall = new Set(parts.filter((p) => p.state !== "left" && p.state !== "declined").map((p) => p.id));
  const list = Object.values(users).filter(
    (u) =>
      u.id !== "me" &&
      u.connected &&
      !blocked.includes(u.id) &&
      (!q || u.displayName.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.replace("@", "").toLowerCase())),
  );
  return (
    <div>
      <label className="mb-2 flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-3">
        <Search className="size-4 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou @username" className="flex-1 bg-transparent text-[15px] outline-none" />
      </label>
      <div className="no-scrollbar max-h-[42vh] overflow-y-auto">
        {list.map((u) => {
          const p = parts.find((x) => x.id === u.id);
          return (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <Avatar user={face(u)} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{u.displayName}</p>
                <p className="truncate text-[12px] text-muted">@{u.username}</p>
              </div>
              {inCall.has(u.id) ? (
                <span className="text-[12px] text-muted">{p ? PART_LABEL[p.state] : ""}</span>
              ) : (
                <button
                  type="button"
                  className="press min-h-9 rounded-full bg-accent px-3 text-[13px] font-semibold text-accent-fg"
                  onClick={() => {
                    callEngine.invite(u.id);
                    haptic("success");
                    onDone();
                  }}
                >
                  Inviter
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ParticipantsList({ onAdd }: { onAdd: () => void }) {
  const users = useWgoStore((s) => s.users);
  const c = useCall();
  return (
    <div className="pb-2">
      <div className="flex items-center gap-3 py-2">
        <Avatar user={face(users.me) ?? undefined} size={40} />
        <p className="flex-1 text-[15px] font-medium">Moi</p>
        <span className="text-[12px] text-muted">{c.muted ? "Micro coupé" : "Connecté"}</span>
      </div>
      {c.participants.map((p) => (
        <div key={p.id} className="flex items-center gap-3 py-2">
          <Avatar user={face(users[p.id])} size={40} />
          <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{users[p.id]?.displayName}</p>
          <span className={cn("text-[12px]", p.state === "connected" && c.speakingId === p.id ? "text-accent" : "text-muted")}>
            {p.state === "connected" ? (p.muted ? "Micro coupé" : c.speakingId === p.id ? "Parle" : "Connecté") : PART_LABEL[p.state]}
          </span>
        </div>
      ))}
      <button type="button" className="press mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-surface-2 text-[15px] font-medium" onClick={onAdd}>
        <UserPlus className="size-4" /> Ajouter quelqu’un
      </button>
    </div>
  );
}

function MoreMenu({ onClose }: { onClose: () => void }) {
  const c = useCall();
  const users = useWgoStore((s) => s.users);
  const peer = c.participants.find((p) => p.state === "connected");
  const name = peer ? users[peer.id]?.firstName : "";
  const row = (label: string, fn: () => void) => (
    <button
      key={label}
      type="button"
      className="press flex min-h-12 w-full items-center rounded-2xl px-3 text-left text-[15px] active:bg-surface-2"
      onClick={() => {
        fn();
        onClose();
      }}
    >
      {label}
    </button>
  );
  return (
    <div className="pb-2">
      {c.media === "audio" ? row("Activer la vidéo", () => void callEngine.toggleCamera()) : row("Changer de caméra", () => callEngine.flipCamera())}
      {c.group ? null : row("Ajouter quelqu’un", () => undefined)}
      <p className="mt-3 mb-1 px-3 text-[11px] font-semibold tracking-wide text-muted uppercase">Simulation</p>
      {row("Connexion instable", () => callEngine.simUnstable())}
      {row("Coupure réseau puis reprise", () => callEngine.simDrop(true))}
      {row("Coupure réseau définitive", () => callEngine.simDrop(false))}
      {peer ? row(`${name} ${peer.camOff ? "rallume" : "coupe"} sa caméra`, () => callEngine.simPeer(peer.id, { camOff: !peer.camOff })) : null}
      {peer ? row(`${name} ${peer.muted ? "réactive" : "coupe"} son micro`, () => callEngine.simPeer(peer.id, { muted: !peer.muted })) : null}
      {c.group && peer ? row(`${name} quitte l’appel`, () => callEngine.simPeer(peer.id, { left: true })) : null}
    </div>
  );
}

function VideoAskDialog() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/55 px-8">
      <div role="alertdialog" aria-label="Activer la vidéo ?" className="glass-strong w-full max-w-[300px] rounded-[24px] p-5 text-center text-fg">
        <Camera className="mx-auto size-7 text-accent" />
        <h2 className="mt-2 text-[17px] font-semibold">Activer la vidéo ?</h2>
        <p className="mt-1 text-[13px] text-muted">Ta caméra sera visible par les participants.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="press min-h-11 rounded-full bg-surface-2 text-[15px]" onClick={() => void callEngine.confirmVideo(false)}>
            Annuler
          </button>
          <button type="button" className="press min-h-11 rounded-full bg-accent text-[15px] font-semibold text-accent-fg" onClick={() => void callEngine.confirmVideo(true)}>
            Activer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ Autorisations ============================ */

function PermissionScreen() {
  const p = useCall((s) => s.permission)!;
  const mic = p.kind === "mic";
  const denied = p.stage === "denied";
  return (
    <div className="absolute inset-0 z-[75] flex flex-col bg-navy px-7 pt-24 pb-[max(28px,env(safe-area-inset-bottom))] text-paper">
      <div className="flex flex-1 flex-col items-center text-center">
        <span className={cn("flex size-20 items-center justify-center rounded-full", denied ? "bg-paper/10" : "bg-accent/15")}>
          {mic ? (denied ? <MicOff className="size-9 text-paper/70" /> : <Mic className="size-9 text-accent" />) : denied ? <VideoOff className="size-9 text-paper/70" /> : <Video className="size-9 text-accent" />}
        </span>
        <h1 className="mt-6 text-[24px] font-semibold tracking-tight">
          {denied ? (mic ? "Micro non autorisé" : "Caméra non autorisée") : mic ? "Autoriser le microphone" : "Autoriser la caméra"}
        </h1>
        <p className="mt-3 max-w-[32ch] text-[15px] leading-relaxed text-paper/65">
          {denied
            ? mic
              ? "Sans le micro, personne ne pourra t’entendre pendant les appels et les messages vocaux ne fonctionneront pas. Tu peux l’autoriser dans les réglages de ton navigateur."
              : "Sans la caméra, ta vidéo restera coupée : les autres verront ta photo de profil. Tu peux l’autoriser dans les réglages de ton navigateur."
            : mic
              ? "WIPP utilise ton microphone pour tes appels et messages vocaux."
              : "WIPP utilise ta caméra pour tes appels vidéo. Tu choisis toujours quand l’allumer."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {denied ? (
          <>
            <button type="button" className="press min-h-12 rounded-full bg-accent text-[16px] font-semibold text-accent-fg" onClick={() => void callEngine.permission.confirm()}>
              Réessayer
            </button>
            <button type="button" className="press min-h-12 rounded-full bg-paper/10 text-[15px]" onClick={() => callEngine.permission.without()}>
              {mic ? "Continuer sans micro" : "Continuer sans caméra"}
            </button>
          </>
        ) : (
          <button type="button" className="press min-h-12 rounded-full bg-accent text-[16px] font-semibold text-accent-fg" onClick={() => void callEngine.permission.confirm()}>
            Continuer
          </button>
        )}
        <button type="button" className="press min-h-11 text-[14px] text-paper/60" onClick={() => callEngine.permission.cancel()}>
          Annuler
        </button>
      </div>
    </div>
  );
}

/* ============================ Appel réduit ============================ */

function MiniCall() {
  const c = useCall();
  const users = useWgoStore((s) => s.users);
  const elapsed = useElapsed(c.connectedAt);
  const lead = users[c.participants[0]?.id ?? ""];
  const name = c.group ? c.title || "Appel de groupe" : lead?.firstName ?? lead?.displayName;
  const label = c.status === "connected" ? clock(elapsed) : statusLabel(c, elapsed);

  if (c.media === "video") {
    const p = c.participants.find((x) => x.state === "connected") ?? c.participants[0];
    return (
      <div className="pointer-events-none absolute inset-0 z-[70]">
        <CornerFloat w={116} h={168} inset={{ top: 64, bottom: 110 }} onTap={() => callEngine.expand()} className="overflow-hidden rounded-2xl shadow-[0_14px_36px_rgba(0,0,0,.5)] outline outline-1 outline-white/25">
          <div className="relative size-full text-paper" aria-label="Revenir à l’appel">
            {p ? <RemoteTile p={p} /> : null}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-2 pt-4 pb-1.5 text-[11px] font-semibold tabular-nums">
              {name} · {label}
            </span>
            <span className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-ink/50">
              <Maximize2 className="size-3" />
            </span>
            <button
              type="button"
              aria-label="Raccrocher"
              className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-danger"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => callEngine.hangup()}
            >
              <PhoneOff className="size-3.5" />
            </button>
          </div>
        </CornerFloat>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[70] flex justify-center pt-[max(52px,env(safe-area-inset-top))]">
      <div className="call-mini pointer-events-auto flex items-center gap-1 rounded-full bg-navy py-1.5 pr-1.5 pl-1.5 text-paper shadow-[0_12px_32px_rgba(0,0,0,.45)] outline outline-1 outline-white/15">
        <button type="button" className="press flex min-h-10 items-center gap-2 pr-2" onClick={() => callEngine.expand()} aria-label="Revenir à l’appel">
          <span className={cn("call-face rounded-full", c.speakingId && "is-speaking")}>
            <Avatar user={face(lead)} size={32} />
          </span>
          <span className="max-w-[120px] truncate text-[14px] font-semibold">{name}</span>
          <span className="text-[13px] tabular-nums text-accent">{label}</span>
        </button>
        <button type="button" aria-label={c.muted ? "Réactiver le micro" : "Couper le micro"} aria-pressed={c.muted} className={cn("press flex size-10 items-center justify-center rounded-full", c.muted ? "bg-paper text-navy" : "bg-paper/10")} onClick={() => callEngine.toggleMute()}>
          {c.muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </button>
        <button type="button" aria-label="Revenir à l’appel" className="press flex size-10 items-center justify-center rounded-full bg-paper/10" onClick={() => callEngine.expand()}>
          <Maximize2 className="size-4" />
        </button>
        <button type="button" aria-label="Raccrocher" className="press flex size-10 items-center justify-center rounded-full bg-danger" onClick={() => callEngine.hangup()}>
          <PhoneOff className="size-4" />
        </button>
      </div>
    </div>
  );
}

export { formatDuration };
