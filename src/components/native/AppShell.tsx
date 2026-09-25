import { useState } from "react";
import { MessageCircle, PhoneCall, Compass, User, SmartphoneNfc } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { StackNavigator } from "./StackNavigator";
import { TabBar, type Tab } from "./TabBar";
import { Sheet } from "./Sheet";
import { layout } from "@/theme/theme";
import { ChatsScreen } from "@/screens/ChatsScreen";
import { CallsScreen } from "@/screens/CallsScreen";
import { ExploreScreen } from "@/screens/ExploreScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { AddContactSheet } from "@/screens/OtherScreens";

const tabs: Tab[] = [
  { key: "chats", label: "Discussions", icon: MessageCircle, badge: "9+" },
  { key: "calls", label: "Appels", icon: PhoneCall, badge: 1 },
  { key: "wipp", label: "WIPP", icon: SmartphoneNfc, center: true },
  { key: "explore", label: "Explorer", icon: Compass },
  { key: "profile", label: "Profil", icon: User },
];

/** Coquille native : cadre mobile 390x844 sur grand écran, plein écran sur téléphone. */
export function AppShell() {
  const [tab, setTab] = useState("calls");
  const [sheet, setSheet] = useState(false);
  const selectTab = (k: string) => (k === "wipp" ? setSheet(true) : setTab(k));

  const screen =
    tab === "chats" ? <ChatsScreen onCompose={() => setSheet(true)} /> :
    tab === "calls" ? <CallsScreen /> :
    tab === "explore" ? <ExploreScreen /> : <ProfileScreen />;

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-wipp-bg font-body">
      <div
        className="relative h-full w-full overflow-hidden bg-wipp-bg sm:h-[844px] sm:max-h-full sm:w-[390px] sm:rounded-[44px] sm:border sm:border-wipp-glass-border"
        style={{ ["--tabbar-h" as string]: `${layout.tabBarHeight}px` }}
      >
        <StackNavigator
          root={
            <div className="relative h-full">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={tab} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {screen}
                </motion.div>
              </AnimatePresence>
              <TabBar tabs={tabs} active={tab} onChange={selectTab} />
            </div>
          }
        />
        <Sheet open={sheet} onClose={() => setSheet(false)}>
          <AddContactSheet onClose={() => setSheet(false)} />
        </Sheet>
      </div>
    </div>
  );
}
