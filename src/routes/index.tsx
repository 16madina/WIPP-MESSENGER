import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/native/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WIPP — Discussions et appels" },
      { name: "description", content: "Discutez, appelez et partagez des surprises avec WIPP. Votre numéro reste privé." },
      { property: "og:title", content: "WIPP — Discussions et appels" },
      { property: "og:description", content: "Discutez, appelez et partagez des surprises avec WIPP. Votre numéro reste privé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppShell,
});
