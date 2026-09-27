// WIPP — notifications push (navigateur).
// Demande l'autorisation, enregistre le service worker FCM et envoie
// le jeton de l'appareil au serveur. Le jeton ne sert qu'à notifier.
import { savePushToken } from "./push.functions";

const VAPID_KEY = "BNCG00EOxmBBzSczaXXt0cN95HGm5J5lbTi60hoV0gWaLMTn7Wzhkg4QEH-8ABrgF45qyBa-IMHigCj9OWF_kuM";

const firebaseConfig = {
  apiKey: "AIzaSyC0shdKNw1FiaL0D_F0xwN9lHt3j6H--CY",
  authDomain: "wipp-61124.firebaseapp.com",
  projectId: "wipp-61124",
  appId: "1:385207231117:web:a3feda22b6868358e238c4",
  messagingSenderId: "385207231117",
};

export type PushStatus =
  | "registered"
  | "unsupported"
  | "open-in-new-tab"
  | "denied"
  | "error";

/** À appeler depuis un geste utilisateur (bouton). Renvoie l'état obtenu. */
export async function enablePush(): Promise<PushStatus> {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
    const { isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return "unsupported";
    // L'aperçu Lovable tourne dans un cadre : la demande de permission y est refusée.
    if (window.top !== window.self) return "open-in-new-tab";

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const query = new URLSearchParams(firebaseConfig).toString();
    const swRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);

    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration });
    if (!token) return "denied";

    await savePushToken({ data: { token, platform: "web" } });

    // Message reçu pendant que l'app est ouverte : bannière discrète.
    onMessage(messaging, (payload) => {
      const n = payload.notification || {};
      void swRegistration.showNotification(n.title || "WIPP", {
        body: n.body || "Nouveau message",
        icon: "/favicon.svg",
        data: payload.data || {},
      });
    });

    return "registered";
  } catch {
    return "error";
  }
}

/** Vrai si les notifications sont déjà autorisées et enregistrables ici. */
export function pushAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    window.top === window.self
  );
}
