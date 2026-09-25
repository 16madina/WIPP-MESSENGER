import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type PanInfo } from "framer-motion";
import { ArrowUp, Copy, Mic, Pencil, Phone, Pin, Reply, Trash2, Video, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavBar } from "@/components/native/NavHeader";
import { Pressable } from "@/components/native/Pressable";
import { Avatar } from "@/components/native/Avatar";
import { MessageStatus } from "@/components/native/MessageStatus";
import { useStack } from "@/components/native/StackNavigator";
import { useOverlay } from "@/components/native/Overlay";
import { useLongPress } from "@/components/native/useLongPress";
import { useElastic } from "@/components/native/useElastic";
import { messages as seed, type Chat, type Message } from "@/data/mock";
import { motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";
import { SurpriseFlow } from "@/components/native/SurpriseFlow";
import { SurpriseCard, type SurpriseMessage } from "@/components/native/SurpriseCard";

type Pos = "single" | "first" | "middle" | "last";
const EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

/** Hauteur du clavier via visualViewport (0 sans clavier). */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const f = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener("resize", f);
    vv.addEventListener("scroll", f);
    return () => {
      vv.removeEventListener("resize", f);
      vv.removeEventListener("scroll", f);
    };
  }, []);
  return inset;
}

const now = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function BubbleBody({ msg, pos, quote }: { msg: Message; pos: Pos; quote?: Message | undefined }) {
  const r = "18px";
  const t = "5px";
  const tight = { top: pos === "middle" || pos === "last", bottom: pos === "first" || pos === "middle" };
  const tail = pos === "last" || pos === "single";
  const radius = msg.mine
    ? `${r} ${tight.top ? t : r} ${tight.bottom || tail ? t : r} ${r}`
    : `${tight.top ? t : r} ${r} ${r} ${tight.bottom || tail ? t : r}`;
  return (
    <div className={`relative max-w-[78vw] px-3 py-[7px] type-body sm:max-w-[290px] ${msg.mine ? "bg-wipp-mine text-wipp-mine-fg" : "bg-wipp-other text-wipp-other-fg"}`} style={{ borderRadius: radius }}>
      {quote && (
        <div className={`mb-1 rounded-[10px] border-l-[3px] px-2 py-1 type-footnote ${msg.mine ? "border-wipp-accent-fg/40 bg-wipp-accent-fg/10" : "border-wipp-accent bg-wipp-fg/5"}`}>
          <div className="font-semibold">{quote.mine ? "Vous" : "Réponse"}</div>
          <div className="truncate opacity-75">{quote.text}</div>
        </div>
      )}
      <span className={msg.deleted ? "italic opacity-60" : ""}>{msg.deleted ? "Message supprimé" : msg.text}</span>
      <span className="ml-2 inline-flex translate-y-[3px] items-center gap-1 float-right type-caption2 opacity-55">
        {msg.pinned && <Pin size={10} />}
        {msg.edited && "modifié"} {msg.time}
      </span>
      {tail && (
        <svg width="10" height="16" viewBox="0 0 10 16" className={`absolute bottom-0 ${msg.mine ? "-right-[6px] text-wipp-mine" : "-left-[6px] -scale-x-100 text-wipp-other"}`}>
          <path d="M0 0 C0 8 3 14 10 16 C4 16 1 15 0 14 Z" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}

function Bubble({ msg, pos, quote, onReply, onMenu }: { msg: Message; pos: Pos; quote?: Message | undefined; onReply: () => void; onMenu: (el: HTMLElement) => void }) {
  const x = useMotionValue(0);
  const iconOpacity = useTransform(x, [10, m.replyThreshold], [0, 1]);
  const iconScale = useTransform(x, [10, m.replyThreshold], [0.4, 1]);
  const armed = useRef(false);
  useMotionValueEvent(x, "change", (v) => {
    const a = v > m.replyThreshold;
    if (a !== armed.current) {
      armed.current = a;
      if (a) haptic("light");
    }
  });
  const longPress = useLongPress(onMenu);
  return (
    <div className={`relative flex ${msg.mine ? "justify-end pr-1.5" : "justify-start pl-1.5"}`}>
      <motion.span style={{ opacity: iconOpacity, scale: iconScale }} className="absolute left-2 top-1/2 -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-wipp-surface text-wipp-fg">
        <Reply size={16} />
      </motion.span>
      <motion.div
        style={{ x }}
        drag={msg.deleted ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 500, bounceDamping: 32 }}
        onDragEnd={(_: unknown, i: PanInfo) => {
          if (i.offset.x * 0.5 > m.replyThreshold) onReply();
        }}
        className="relative flex flex-col items-end"
      >
        <div {...longPress}>
          <BubbleBody msg={msg} pos={pos} quote={quote} />
        </div>
        {!!msg.reactions?.length && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={m.tabBounce} className={`-mt-1.5 mb-1 rounded-full border-2 border-wipp-bg bg-wipp-elevated px-1.5 text-[14px] leading-6 ${msg.mine ? "mr-2" : "ml-2 self-start"}`}>
            {msg.reactions.join("")}
          </motion.span>
        )}
      </motion.div>
      {msg.mine && msg.state && (pos === "last" || pos === "single") && <span className="absolute -bottom-3.5 right-3"><MessageStatus state={msg.state} /></span>}
    </div>
  );
}

export function ChatScreen({ chat }: { chat: Chat }) {
  const { pop } = useStack();
  const { openMenu, notify } = useOverlay();
  const [list, setList] = useState<Message[]>(seed);
  const [surprises, setSurprises] = useState<SurpriseMessage[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const kb = useKeyboardInset();
  const { scrollY } = useScroll({ container: scroller });
  const { y } = useElastic(scroller);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" })));
    return () => cancelAnimationFrame(id);
  }, [list.length, surprises.length, kb]);

  const patch = (id: string, p: Partial<Message>) => setList((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const send = () => {
    const body = text.trim();
    if (!body) return;
    haptic("light");
    setText("");
    if (editing) {
      patch(editing.id, { text: body, edited: true });
      setEditing(null);
      return;
    }
    const id = `n${Date.now()}`;
    setList((l) => [...l, { id, mine: true, text: body, time: now(), state: "sending", replyTo: replyTo?.id }]);
    setReplyTo(null);
    window.setTimeout(() => patch(id, { state: "sent" }), 600);
    window.setTimeout(() => patch(id, { state: "delivered" }), 1300);
    window.setTimeout(() => patch(id, { state: "read" }), 2400);
    window.setTimeout(() => setList((l) => [...l, { id: `r${Date.now()}`, mine: false, text: "Bien reçu 👌", time: now() }]), 2900);
  };

  const menuFor = (msg: Message, pos: Pos, el: HTMLElement) =>
    openMenu({
      anchor: el,
      preview: <div className={`flex ${msg.mine ? "justify-end" : ""}`}><BubbleBody msg={msg} pos={pos} quote={list.find((q) => q.id === msg.replyTo)} /></div>,
      reactions: { emojis: EMOJIS, onReact: (e) => patch(msg.id, { reactions: msg.reactions?.includes(e) ? msg.reactions.filter((r) => r !== e) : [...(msg.reactions ?? []), e] }) },
      actions: [
        { key: "reply", label: "Répondre", icon: Reply, onSelect: () => { setReplyTo(msg); inputRef.current?.focus(); } },
        { key: "copy", label: "Copier", icon: Copy, onSelect: () => { void navigator.clipboard?.writeText(msg.text).catch(() => undefined); notify("Copié"); } },
        { key: "pin", label: msg.pinned ? "Désépingler" : "Épingler", icon: Pin, onSelect: () => { patch(msg.id, { pinned: !msg.pinned }); notify(msg.pinned ? "Message désépinglé" : "Message épinglé"); } },
        ...(msg.mine ? [{ key: "edit", label: "Modifier", icon: Pencil, onSelect: () => { setEditing(msg); setText(msg.text); inputRef.current?.focus(); } }] : []),
        { key: "delete", label: "Supprimer", icon: Trash2, danger: true, onSelect: () => { haptic("warning"); patch(msg.id, { deleted: true, reactions: [] }); } },
      ],
    });

  const posOf = (i: number): Pos => {
    const prev = list[i - 1], cur = list[i]!, next = list[i + 1];
    const sp = prev && prev.mine === cur.mine;
    const sn = next && next.mine === cur.mine;
    return sp && sn ? "middle" : sp ? "last" : sn ? "first" : "single";
  };

  const banner = replyTo ?? editing;

  return (
    <div className="relative flex h-full flex-col bg-wipp-bg">
      <div className="absolute inset-x-0 top-0 z-20">
        <NavBar
          large={false}
          scrollY={scrollY}
          onBack={pop}
          title={
            <span className="flex flex-col items-center leading-tight">
              <span className="type-nav">{chat.name}</span>
              <span className="type-caption2 text-wipp-muted">{chat.online ? "en ligne" : "vu récemment"}</span>
            </span>
          }
          right={
            <>
              <Pressable className="text-wipp-accent" aria-label="Appel vidéo"><Video size={23} /></Pressable>
              <Pressable className="text-wipp-accent" aria-label="Appel audio"><Phone size={20} /></Pressable>
            </>
          }
        />
      </div>

      <div ref={scroller} className="no-scrollbar flex-1 overflow-y-auto" style={{ paddingTop: "calc(env(safe-area-inset-top) + 56px)", paddingBottom: 76 + (banner ? 48 : 0) + kb }}>
        <motion.div style={{ y }} className="flex min-h-full flex-col justify-end px-1.5 pb-4">
          <div className="mb-3 flex flex-col items-center gap-1 pt-2">
            <Avatar name={chat.name} size={64} online={chat.online} />
            <span className="type-caption text-wipp-muted">Aujourd'hui</span>
          </div>
          <AnimatePresence initial={false}>
            {list.map((msg, i) => {
              const pos = posOf(i);
              return (
                <motion.div
                  key={msg.id}
                  layout="position"
                  initial={{ opacity: 0, y: 28, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={m.message}
                  style={{ originX: msg.mine ? 1 : 0, originY: 1 }}
                  className={pos === "first" || pos === "single" ? "mt-2" : "mt-[2px]"}
                >
                  <Bubble
                    msg={msg}
                    pos={pos}
                    quote={list.find((q) => q.id === msg.replyTo)}
                    onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                    onMenu={(el) => menuFor(msg, pos, el)}
                  />
                </motion.div>
              );
            })}
            {surprises.map((surprise) => (
              <motion.div key={surprise.id} initial={{ opacity: 0, y: 28, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={m.message} className={`mt-3 flex ${surprise.mine ? "justify-end" : "justify-start"}`}>
                <div className="relative"><SurpriseCard message={surprise} /><span className="absolute bottom-1 right-3 type-caption2 text-wipp-surprise-paper/70">{surprise.time}</span></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="glass absolute inset-x-0 bottom-0 z-20 border-t border-wipp-sep" style={{ transform: `translateY(${-kb}px)`, paddingBottom: kb ? 6 : "calc(env(safe-area-inset-bottom) + 6px)" }}>
        <AnimatePresence initial={false}>
          {banner && (
            <motion.div key="rb" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={m.spring} className="flex items-center gap-2 border-b border-wipp-sep px-3 py-1.5">
              {editing ? <Pencil size={16} className="text-wipp-accent" /> : <Reply size={16} className="text-wipp-accent" />}
              <div className="min-w-0 flex-1">
                <div className="type-footnote font-semibold text-wipp-accent">{editing ? "Modifier le message" : `Répondre à ${banner.mine ? "vous" : chat.name}`}</div>
                <div className="truncate type-footnote text-wipp-muted">{banner.text}</div>
              </div>
              <Pressable aria-label="Annuler" onClick={() => { setReplyTo(null); if (editing) { setEditing(null); setText(""); } }} className="text-wipp-muted"><X size={18} /></Pressable>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1 px-1.5 pt-1.5">
           <SurpriseFlow onSend={(message) => setSurprises((items) => [...items, message])} onShareContent={(body) => setList((items) => [...items, { id: `shared-${Date.now()}`, mine: true, text: body, time: now(), state: "sent" }])} onUnavailable={(label) => notify(label)} />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message"
            className="h-9 min-w-0 flex-1 rounded-full border border-wipp-glass-border bg-wipp-surface/70 px-4 type-body text-wipp-fg outline-none placeholder:text-wipp-muted"
          />
          <Pressable onClick={send} aria-label={text.trim() ? "Envoyer" : "Message vocal"} className="relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {text.trim() ? (
                <motion.span key="send" initial={{ scale: 0.3, rotate: -90, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.3, rotate: 90, opacity: 0 }} transition={m.tabBounce} className="flex h-9 w-9 items-center justify-center rounded-full bg-wipp-accent text-wipp-accent-fg">
                  <ArrowUp size={20} strokeWidth={2.6} />
                </motion.span>
              ) : (
                <motion.span key="mic" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }} transition={m.tabBounce} className="flex h-9 w-9 items-center justify-center text-wipp-muted">
                  <Mic size={24} />
                </motion.span>
              )}
            </AnimatePresence>
          </Pressable>
        </div>
      </div>
    </div>
  );
}
