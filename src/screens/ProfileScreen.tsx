import { QrCode, Smartphone, Lock, Palette, Trash2, LogOut, ChevronRight, type LucideIcon } from "lucide-react";
import { Screen } from "@/components/native/Screen";
import { Avatar } from "@/components/native/Avatar";
import { Pressable } from "@/components/native/Pressable";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Segmented, Switch } from "@/components/native/Controls";

type Item = { icon: LucideIcon; label: string; danger?: boolean; onPress?: () => void };

/** Profil : mon profil, mon QR, appareils, confidentialité, apparence, suppression de compte. */
export function ProfileScreen() {
  const [notif, setNotif] = useState(true);
  const [receipts, setReceipts] = useState(true);
  const [mode, setMode] = useState<"auto" | "light" | "dark">("auto");
  const setAppearance = (v: "auto" | "light" | "dark") => {
    setMode(v);
    const r = document.documentElement.classList;
    r.remove("light", "dark");
    if (v !== "auto") r.add(v);
  };
  const groups: Item[][] = [
    [{ icon: QrCode, label: "Mon code QR" }, { icon: Smartphone, label: "Appareils connectés" }],
    [{ icon: Lock, label: "Confidentialité" }, { icon: Palette, label: "Apparence" }],
    [{ icon: LogOut, label: "Se déconnecter", onPress: () => void supabase.auth.signOut() }],
    [{ icon: Trash2, label: "Supprimer mon compte", danger: true }],
  ];
  return (
    <Screen title="Profil" tabKey="profile">
      <div className="mx-4 mb-5 flex items-center gap-3 rounded-[20px] bg-wipp-surface p-4">
        <Avatar name="Madina" size={60} />
        <div className="flex-1">
          <div className="type-title2 text-wipp-fg">Madina</div>
          <div className="type-subhead text-wipp-muted">Compte vérifié</div>
        </div>
        <QrCode size={26} className="text-wipp-accent" />
      </div>
      <div className="mx-4 mb-5 overflow-hidden rounded-[20px] bg-wipp-surface">
        <div className="flex items-center justify-between border-b border-wipp-sep py-1 pl-4 pr-3"><span className="type-body text-wipp-fg">Notifications</span><Switch label="Notifications" checked={notif} onChange={setNotif} /></div>
        <div className="flex items-center justify-between border-b border-wipp-sep py-1 pl-4 pr-3"><span className="type-body text-wipp-fg">Accusés de lecture</span><Switch label="Accusés de lecture" checked={receipts} onChange={setReceipts} /></div>
        <div className="space-y-2 px-4 py-3">
          <span className="type-footnote text-wipp-muted">Apparence</span>
          <Segmented id="mode" value={mode} onChange={setAppearance} options={[{ key: "auto", label: "Auto" }, { key: "light", label: "Clair" }, { key: "dark", label: "Sombre" }]} />
        </div>
      </div>
      {groups.map((g, i) => (
        <div key={i} className="mx-4 mb-5 overflow-hidden rounded-[20px] bg-wipp-surface">
          {g.map(({ icon: Icon, label, danger, onPress }) => (
            <Pressable key={label} onClick={onPress} className="flex w-full items-center gap-3 border-b border-wipp-sep px-4 py-3.5 text-left last:border-0">
              <Icon size={22} className={danger ? "text-wipp-danger" : "text-wipp-accent"} />
              <span className={`flex-1 type-body ${danger ? "text-wipp-danger" : "text-wipp-fg"}`}>{label}</span>
              {!danger && <ChevronRight size={18} className="text-wipp-muted" />}
            </Pressable>
          ))}
        </div>
      ))}
    </Screen>
  );
}
