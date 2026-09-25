import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/native/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WIPP — Messagerie sans numéro" },
      { name: "description", content: "Discutez et appelez sans numéro de téléphone, par username, QR code ou WIPP Touch." },
      { property: "og:title", content: "WIPP — Messagerie sans numéro" },
      { property: "og:description", content: "Messages chiffrés et appels sans numéro de téléphone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppShell,
});
