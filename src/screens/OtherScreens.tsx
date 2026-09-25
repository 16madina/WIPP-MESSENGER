import { QrCode, UserPlus, Smartphone } from "lucide-react";
import { Pressable } from "@/components/native/Pressable";

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
