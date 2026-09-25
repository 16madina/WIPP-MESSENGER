import { Phone, Send, Video } from "lucide-react";
import { Screen } from "@/components/native/Screen";
import { Pressable } from "@/components/native/Pressable";
import { MessageStatus } from "@/components/native/MessageStatus";
import { useStack } from "@/components/native/StackNavigator";
import { messages, type Chat } from "@/data/mock";

export function ChatScreen({ chat }: { chat: Chat }) {
  const { pop } = useStack();
  return (
    <Screen
      title={chat.name}
      large={false}
      onBack={pop}
      bottomInset={false}
      right={
        <>
          <Pressable className="p-2 text-wipp-accent" aria-label="Appel vidéo"><Video size={22} /></Pressable>
          <Pressable className="p-2 text-wipp-accent" aria-label="Appel audio"><Phone size={20} /></Pressable>
        </>
      }
      footer={
        <div className="glass flex items-center gap-2 border-t border-wipp-sep px-3 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
          <input placeholder="Message" className="h-10 flex-1 rounded-full bg-wipp-surface px-4 text-[16px] text-wipp-fg outline-none placeholder:text-wipp-muted" />
          <Pressable className="flex h-10 w-10 items-center justify-center rounded-full bg-wipp-accent text-wipp-accent-fg" aria-label="Envoyer">
            <Send size={18} />
          </Pressable>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5 px-3 pt-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-[20px] px-3.5 py-2 text-[16px] ${msg.mine ? "rounded-br-md bg-wipp-mine text-wipp-mine-fg" : "rounded-bl-md bg-wipp-other text-wipp-other-fg"}`}>
              {msg.text}
              <span className="ml-2 inline-flex items-center gap-1 align-bottom text-[11px] opacity-60">
                {msg.time}
              </span>
            </div>
            {msg.mine && msg.state && <span className="ml-1.5 self-end pb-2"><MessageStatus state={msg.state} /></span>}
          </div>
        ))}
      </div>
    </Screen>
  );
}
