import { AnimatePresence, motion } from "framer-motion";
import { Archive, BellOff, Mail, MailOpen, Pin, PinOff, Search, SquarePen, Trash2, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Screen } from "@/components/native/Screen";
import { Pressable } from "@/components/native/Pressable";
import { Avatar } from "@/components/native/Avatar";
import { MessageStatus } from "@/components/native/MessageStatus";
import { SwipeRow } from "@/components/native/SwipeRow";
import { SkeletonRow } from "@/components/native/Controls";
import { useStack } from "@/components/native/StackNavigator";
import { useOverlay } from "@/components/native/Overlay";
import { useLongPress } from "@/components/native/useLongPress";
import { chats as seed, type Chat } from "@/data/mock";
import { layout, motion as m } from "@/theme/theme";
import { haptic } from "@/lib/haptics";
import { ChatScreen } from "./ChatScreen";

function ChatRowContent({ c }: { c: Chat }) {
  return (
    <div className="flex w-full items-center gap-3 bg-wipp-bg px-4 py-2.5 text-left">
      <Avatar name={c.name} online={c.online} />
      <div className="min-w-0 flex-1 border-b border-wipp-sep pb-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 truncate type-headline text-wipp-fg">
            {c.name}
            {c.muted && <BellOff size={14} className="shrink-0 text-wipp-muted" />}
          </span>
          <span className={`type-caption ${c.unread ? "text-wipp-accent" : "text-wipp-muted"}`}>{c.time}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          {c.state && <MessageStatus state={c.state} />}
          <span className="flex-1 truncate type-subhead text-wipp-muted">{c.last}</span>
          {c.pinned && <Pin size={14} className="shrink-0 rotate-45 text-wipp-muted" />}
          {!!c.unread && <span className="min-w-5 rounded-full bg-wipp-accent px-1.5 text-center text-[12px] font-bold leading-5 text-wipp-accent-fg">{c.unread}</span>}
        </div>
      </div>
    </div>
  );
}

function ChatRow({ c, onOpen, update, remove }: { c: Chat; onOpen: () => void; update: (p: Partial<Chat>) => void; remove: (label: string) => void }) {
  const { openMenu } = useOverlay();
  const pin = () => update({ pinned: !c.pinned });
  const unread = () => update({ unread: c.unread ? 0 : 1 });
  const mute = () => update({ muted: !c.muted });
  const longPress = useLongPress((el) =>
    openMenu({
      anchor: el,
      preview: <ChatRowContent c={c} />,
      actions: [
        { key: "pin", label: c.pinned ? "Désépingler" : "Épingler", icon: c.pinned ? PinOff : Pin, onSelect: pin },
        { key: "unread", label: c.unread ? "Marquer comme lu" : "Marquer non lu", icon: c.unread ? MailOpen : Mail, onSelect: unread },
        { key: "mute", label: c.muted ? "Réactiver le son" : "Sourdine", icon: c.muted ? Bell : BellOff, onSelect: mute },
        { key: "archive", label: "Archiver", icon: Archive, onSelect: () => remove("Discussion archivée") },
        { key: "delete", label: "Supprimer", icon: Trash2, danger: true, onSelect: () => remove("Discussion supprimée") },
      ],
    }),
  );
  return (
    <SwipeRow
      leading={[
        { key: "pin", label: c.pinned ? "Désépingler" : "Épingler", icon: Pin, bg: "bg-wipp-pin", onPress: pin },
        { key: "unread", label: c.unread ? "Lu" : "Non lu", icon: Mail, bg: "bg-wipp-unread", onPress: unread },
      ]}
      trailing={[
        { key: "mute", label: c.muted ? "Son" : "Sourdine", icon: BellOff, bg: "bg-wipp-mute", onPress: mute },
        { key: "archive", label: "Archiver", icon: Archive, bg: "bg-wipp-archive", onPress: () => remove("Discussion archivée") },
        { key: "delete", label: "Supprimer", icon: Trash2, bg: "bg-wipp-delete", onPress: () => remove("Discussion supprimée") },
      ]}
    >
      <div {...longPress} onClick={onOpen} role="button" className="active:opacity-70">
        <ChatRowContent c={c} />
      </div>
    </SwipeRow>
  );
}

export function ChatsScreen({ onCompose }: { onCompose: () => void }) {
  const { push } = useStack();
  const { notify } = useOverlay();
  const [list, setList] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setList(seed);
      setLoading(false);
    }, m.skeletonMs);
    return () => window.clearTimeout(t);
  }, []);

  const update = (id: string, p: Partial<Chat>) => setList((l) => l.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const remove = (id: string, label: string) => {
    haptic("warning");
    setList((l) => l.filter((c) => c.id !== id));
    notify(label);
  };
  const refresh = () =>
    new Promise<void>((res) =>
      window.setTimeout(() => {
        setList((l) => l.map((c) => (c.id === "1" ? { ...c, last: "Tu as vu la photo ?", unread: c.unread + 1, time: "maintenant" } : c)));
        notify("Aïcha", "Tu as vu la photo ?");
        res();
      }, m.refreshMs),
    );

  const term = q.trim().toLowerCase();
  const shown = [...list]
    .filter((c) => !term || c.name.toLowerCase().includes(term) || c.last.toLowerCase().includes(term))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  const S = layout.searchBarHeight;

  return (
    <Screen
      title="Discussions"
      tabKey="chats"
      onRefresh={refresh}
      onPullReveal={() => setSearchOpen(true)}
      onScrollTop={(y) => y > 160 && !q && setSearchOpen(false)}
      right={<Pressable onClick={onCompose} className="text-wipp-accent" aria-label="Nouvelle discussion"><SquarePen size={23} /></Pressable>}
    >
      <motion.div
        className="px-4"
        style={{ height: S }}
        initial={false}
        animate={{ opacity: searchOpen ? 1 : 0, scale: searchOpen ? 1 : 0.92 }}
        transition={m.spring}
      >
        <label className="flex h-9 items-center gap-1.5 rounded-[10px] bg-wipp-seg-track px-2">
          <Search size={17} className="text-wipp-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" className="flex-1 bg-transparent type-body text-wipp-fg outline-none placeholder:text-wipp-muted" />
        </label>
      </motion.div>
      <motion.div initial={false} animate={{ y: searchOpen ? 0 : -S }} transition={m.spring} className="min-h-[100vh]">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {shown.map((c) => (
                <motion.li key={c.id} layout transition={m.spring} exit={{ opacity: 0, x: -60 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ChatRow
                    c={c}
                    onOpen={() => {
                      update(c.id, { unread: 0 });
                      push(<ChatScreen chat={c} />);
                    }}
                    update={(p) => update(c.id, p)}
                    remove={(label) => remove(c.id, label)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>
    </Screen>
  );
}
