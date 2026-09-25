import { QrCode, Smartphone, Lock, Palette, Trash2, LogOut, ChevronRight, type LucideIcon } from "lucide-react";
import { Screen } from "@/components/native/Screen";
import { Avatar } from "@/components/native/Avatar";
import { Pressable } from "@/components/native/Pressable";
import { supabase } from "@/integrations/supabase/client";

type Item = { icon: LucideIcon; label: string; danger?: boolean; onPress?: () => void };

/** Profil : mon profil, mon QR, appareils, confidentialité, apparence, suppression de compte. */
export function ProfileScreen() {
  const groups: Item[][] = [
    [{ icon: QrCode, label: "Mon code QR" }, { icon: Smartphone, label: "Appareils connectés" }],
    [{ icon: Lock, label: "Confidentialité" }, { icon: Palette, label: "Apparence" }],
    [{ icon: LogOut, label: "Se déconnecter", onPress: () => void supabase.auth.signOut() }],
    [{ icon: Trash2, label: "Supprimer mon compte", danger: true }],
  ];
  return (
    <Screen title="Profil">
      <div className="mx-4 mb-5 flex items-center gap-3 rounded-[20px] bg-wipp-surface p-4">
        <Avatar name="Madina" size={60} />
        <div className="flex-1">
          <div className="font-display text-lg font-bold text-wipp-fg">Madina</div>
          <div className="text-[14px] text-wipp-muted">@madina</div>
        </div>
        <QrCode size={26} className="text-wipp-accent" />
      </div>
      {groups.map((g, i) => (
        <div key={i} className="mx-4 mb-5 overflow-hidden rounded-[20px] bg-wipp-surface">
          {g.map(({ icon: Icon, label, danger }) => (
            <Pressable key={label} className="flex w-full items-center gap-3 border-b border-wipp-sep px-4 py-3.5 text-left last:border-0">
              <Icon size={22} className={danger ? "text-wipp-danger" : "text-wipp-accent"} />
              <span className={`flex-1 ${danger ? "text-wipp-danger" : "text-wipp-fg"}`}>{label}</span>
              {!danger && <ChevronRight size={18} className="text-wipp-muted" />}
            </Pressable>
          ))}
        </div>
      ))}
    </Screen>
  );
}
