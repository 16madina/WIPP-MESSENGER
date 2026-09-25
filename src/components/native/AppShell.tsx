import { useEffect, useState } from "react";
import { MessageCircle, PhoneCall, Compass, User, SmartphoneNfc } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { StackNavigator } from "./StackNavigator";
import { TabBar, type Tab } from "./TabBar";
import { Sheet } from "./Sheet";
import { OverlayProvider, Recede } from "./Overlay";
import { layout, motion as m } from "@/theme/theme";
import { ChatsScreen } from "@/screens/ChatsScreen";
import { CallsScreen } from "@/screens/CallsScreen";
import { ExploreScreen } from "@/screens/ExploreScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { AddContactSheet } from "@/screens/OtherScreens";
import { AuthScreen } from "@/screens/AuthScreen";
import { useSession } from "@/hooks/useSession";

const tabs: Tab[] = [
  { key: "chats", label: "Discussions", icon: MessageCircle, badge: "9+" },
  { key: "calls", label: "Appels", icon: PhoneCall, badge: 1 },
  { key: "wipp", label: "WIPP", icon: SmartphoneNfc, center: true },
  { key: "explore", label: "Explorer", icon: Compass },
  { key: "profile", label: "Profil", icon: User },
];

/** Bloque le menu du navigateur à l'appui long et le zoom par pincement (hors champs de saisie). */
function useNativeGuards() {
  useEffect(() => {
    const ctx = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest("input, textarea")) e.preventDefault();
    };
    const gesture = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", ctx);
    document.addEventListener("gesturestart", gesture);
    return () => {
      document.removeEventListener("contextmenu", ctx);
      document.removeEventListener("gesturestart", gesture);
    };
  }, []);
}

/** Coquille native : cadre mobile 390x844 sur grand écran, plein écran sur téléphone. */
export function AppShell() {
  const session = useSession();
  useNativeGuards();
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-[100dvh] w-full items-center justify-center bg-wipp-bg font-body">
        <div
          className="relative h-full w-full overflow-hidden bg-wipp-bg sm:h-[844px] sm:max-h-full sm:w-[390px] sm:rounded-[44px] sm:border sm:border-wipp-glass-border"
          style={{ ["--tabbar-space" as string]: `${layout.tabBarHeight + layout.tabBarMargin + 24}px` }}
        >
          {session === undefined ? null : !session ? <AuthScreen /> : (
            <OverlayProvider>
              <Main />
            </OverlayProvider>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}

function Main() {
  const [tab, setTab] = useState("chats");
  const [sheet, setSheet] = useState(false);
  const selectTab = (k: string) => (k === "wipp" ? setSheet(true) : setTab(k));

  const screen =
    tab === "chats" ? <ChatsScreen onCompose={() => setSheet(true)} /> :
    tab === "calls" ? <CallsScreen /> :
    tab === "explore" ? <ExploreScreen /> : <ProfileScreen />;

  return (
    <>
      <Recede>
        <StackNavigator
          root={
            <div className="relative h-full">
              <AnimatePresence initial={false}>
                <motion.div key={tab} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: m.tabFade }}>
                  {screen}
                </motion.div>
              </AnimatePresence>
              <TabBar tabs={tabs} active={tab} onChange={selectTab} />
            </div>
          }
        />
      </Recede>
      <Sheet open={sheet} onClose={() => setSheet(false)}>
        <AddContactSheet onClose={() => setSheet(false)} />
      </Sheet>
    </>
  );
}
