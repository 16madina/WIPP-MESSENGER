import { Fragment } from "react";
import { Avatar } from "@/components/avatar";
import { Sheet } from "@/components/ui";
import { useWgoStore } from "@/lib/store";
import type { Message, User } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Évènement de groupe discret (pas une bulle). */
export function SystemEvent({ text }: { text?: string }) {
  return (
    <div className="my-2.5 flex justify-center">
      <span className="max-w-[86%] rounded-full bg-surface/70 px-3 py-1 text-center text-[11.5px] leading-snug text-muted ring-1 ring-hair backdrop-blur">
        {text}
      </span>
    </div>
  );
}

/** Texte avec @mentions surlignées ; la mention qui me vise ressort davantage. */
export function MentionText({ text, mentions, mine }: { text: string; mentions?: string[]; mine?: boolean }) {
  const parts = text.split(/(@[\p{L}\p{N}_.-]+)/u);
  const meTargeted = Boolean(mentions?.includes("me") || mentions?.includes("all"));
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") && p.length > 1 ? (
          <span
            key={i}
            className={cn(
              "rounded px-0.5 font-semibold",
              mine ? "text-paper" : "text-accent",
              meTargeted && !mine && (p === "@Vous" || p === "@toutlemonde") && "bg-accent/20",
            )}
          >
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Liste des participants proposée quand on tape @. */
export function MentionPicker({
  query,
  members,
  allowEveryone,
  onPick,
}: {
  query: string;
  members: User[];
  allowEveryone: boolean;
  onPick: (label: string, id: string) => void;
}) {
  const q = query.toLowerCase();
  const list = members.filter(
    (u) => u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
  );
  const everyone = allowEveryone && "toutlemonde".startsWith(q);
  if (!list.length && !everyone) return null;
  return (
    <div className="glass mx-3 mb-1 max-h-52 overflow-y-auto rounded-2xl py-1 ring-1 ring-hair no-scrollbar" role="listbox" aria-label="Mentionner">
      {everyone ? (
        <button type="button" className="press flex min-h-11 w-full items-center gap-3 px-3 text-left" onClick={() => onPick("toutlemonde", "all")}>
          <span className="flex size-8 items-center justify-center rounded-full bg-accent/20 text-[13px] font-bold text-accent">@</span>
          <span className="text-[14px] font-medium">@toutlemonde</span>
          <span className="ml-auto text-[11px] text-muted">Admins</span>
        </button>
      ) : null}
      {list.map((u) => (
        <button key={u.id} type="button" className="press flex min-h-11 w-full items-center gap-3 px-3 text-left" onClick={() => onPick(u.firstName || u.displayName, u.id)}>
          <Avatar user={u} size={32} />
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium">{u.displayName}</span>
            <span className="block truncate text-[12px] text-muted">@{u.username}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Pastilles regroupées : ❤️ 4   😂 2 */
export function ReactionPills({ m, mine, onOpen }: { m: Message; mine: boolean; onOpen: () => void }) {
  const counts = new Map<string, number>();
  for (const r of m.reactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  const meReacted = new Set(m.reactions.filter((r) => r.userId === "me").map((r) => r.emoji));
  return (
    <div className={cn("mt-0.5 flex gap-1", mine ? "justify-end" : "justify-start")}>
      {[...counts].map(([emoji, n]) => (
        <button
          key={emoji}
          type="button"
          aria-label={`Réactions ${emoji}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className={cn("hairline flex min-h-6 items-center gap-0.5 rounded-full bg-surface px-1.5 text-[12px]", meReacted.has(emoji) && "ring-1 ring-accent")}
        >
          {emoji}
          {n > 1 ? <span className="tabular-nums text-muted">{n}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Feuille « Réactions » : qui a utilisé chaque emoji. */
export function ReactionsSheet({ m, onClose }: { m: Message | null; onClose: () => void }) {
  const users = useWgoStore((s) => s.users);
  const me = useWgoStore((s) => s.me);
  const groups = new Map<string, string[]>();
  for (const r of m?.reactions ?? []) groups.set(r.emoji, [...(groups.get(r.emoji) ?? []), r.userId]);
  return (
    <Sheet open={Boolean(m)} onClose={onClose} title="Réactions">
      <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
        {[...groups].map(([emoji, ids]) => (
          <div key={emoji} className="mb-3">
            <p className="mb-1 text-[13px] font-semibold">
              {emoji} <span className="text-muted">{ids.length}</span>
            </p>
            {ids.map((id) => {
              const u = id === "me" ? me : users[id];
              return (
                <div key={id} className="flex min-h-11 items-center gap-3">
                  <Avatar user={u} size={32} />
                  <span className="text-[14px]">{id === "me" ? "Vous" : u?.displayName}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
