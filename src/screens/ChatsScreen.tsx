import { SquarePen } from "lucide-react";
import { Screen } from "@/components/native/Screen";
import { Pressable } from "@/components/native/Pressable";
import { Avatar } from "@/components/native/Avatar";
import { MessageStatus } from "@/components/native/MessageStatus";
import { useStack } from "@/components/native/StackNavigator";
import { chats } from "@/data/mock";
import { ChatScreen } from "./ChatScreen";

export function ChatsScreen({ onCompose }: { onCompose: () => void }) {
  const { push } = useStack();
  return (
    <Screen
      title="Discussions"
      right={<Pressable onClick={onCompose} className="p-2 text-wipp-accent" aria-label="Nouvelle discussion"><SquarePen size={22} /></Pressable>}
    >
      <div className="px-4 pb-2">
        <input placeholder="Rechercher" className="h-9 w-full rounded-xl bg-wipp-surface px-3 text-[16px] text-wipp-fg outline-none placeholder:text-wipp-muted" />
      </div>
      <ul>
        {chats.map((c) => (
          <li key={c.id}>
            <Pressable onClick={() => push(<ChatScreen chat={c} />)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-wipp-surface">
              <Avatar name={c.name} online={c.online} />
              <div className="min-w-0 flex-1 border-b border-wipp-sep pb-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-wipp-fg">{c.name}</span>
                  <span className={`text-[13px] ${c.unread ? "text-wipp-accent" : "text-wipp-muted"}`}>{c.time}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  {c.state && <MessageStatus state={c.state} />}
                  <span className="flex-1 truncate text-[15px] text-wipp-muted">{c.last}</span>
                  {!!c.unread && <span className="min-w-5 rounded-full bg-wipp-accent px-1.5 text-center text-[12px] font-bold leading-5 text-wipp-accent-fg">{c.unread}</span>}
                </div>
              </div>
            </Pressable>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
