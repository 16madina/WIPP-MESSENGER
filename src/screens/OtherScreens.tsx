import { QrCode, UserPlus, Smartphone } from "lucide-react";
import { Screen } from "@/components/native/Screen";
import { Avatar } from "@/components/native/Avatar";
import { Pressable } from "@/components/native/Pressable";
import { chats } from "@/data/mock";

export function ContactsScreen() {
  return (
    <Screen title="Contacts">
      <ul>
        {chats.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-2">
            <Avatar name={c.name} size={40} online={c.online} />
            <div className="flex-1 border-b border-wipp-sep pb-2">
              <div className="font-semibold text-wipp-fg">{c.name}</div>
              <div className="text-[13px] text-wipp-muted">@{c.username}</div>
            </div>
          </li>
        ))}
      </ul>
    </Screen>
  );
}

export function SettingsScreen() {
  return (
    <Screen title="Réglages">
      <div className="mx-4 flex items-center gap-3 rounded-[20px] bg-wipp-surface p-4">
        <Avatar name="Madina" size={60} />
        <div>
          <div className="font-display text-lg font-bold text-wipp-fg">Madina</div>
          <div className="text-[14px] text-wipp-muted">@madina</div>
        </div>
      </div>
    </Screen>
  );
}

export function AddContactSheet({ onClose }: { onClose: () => void }) {
  const items = [
    { icon: UserPlus, label: "Par nom d'utilisateur" },
    { icon: QrCode, label: "Scanner un code QR" },
    { icon: Smartphone, label: "WIPP Touch" },
  ];
  return (
    <div className="px-4">
      <h2 className="mb-3 font-display text-[22px] font-bold text-wipp-fg">Ajouter un contact</h2>
      <div className="overflow-hidden rounded-[20px] bg-wipp-surface">
        {items.map(({ icon: Icon, label }) => (
          <Pressable key={label} onClick={onClose} className="flex w-full items-center gap-3 border-b border-wipp-sep px-4 py-3.5 text-left last:border-0">
            <Icon size={22} className="text-wipp-accent" />
            <span className="text-wipp-fg">{label}</span>
          </Pressable>
        ))}
      </div>
    </div>
  );
}
