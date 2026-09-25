import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ occasion: z.string().trim().min(2).max(300), tone: z.string().trim().min(2).max(40) });

/** Génère un message de surprise (flux SSE de l'AI Gateway, réservé aux utilisateurs connectés). */
export const Route = createFileRoute("/api/surprise-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Connexion requise", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: user } = await supabaseAdmin.auth.getUser(token);
        if (!user?.user) return new Response("Connexion requise", { status: 401 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Décris l'occasion et choisis un ton.", { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Assistant non configuré", { status: 500 });
        const { occasion, tone } = parsed.data;
        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
            method: "POST",
            signal: request.signal,
            headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
            body: JSON.stringify({
              model: "openai/gpt-6-astra",
              stream: true,
              store: false,
              reasoning: { effort: "low", summary: "auto" },
              include: ["reasoning.encrypted_content"],
              input: [
                { role: "system", content: "Tu écris des messages de surprise en français pour une messagerie privée entre adultes. Réponds uniquement par le message lui-même, sans guillemets ni introduction, 280 caractères maximum, chaleureux et personnel, au plus deux emoji." },
                { role: "user", content: `Occasion : ${occasion}\nTon souhaité : ${tone}` },
              ],
            }),
          });
          const headers = new Headers({ "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream" });
          if (!upstream.ok) {
            const msg = upstream.status === 429 ? "Trop de demandes, réessaie dans un instant."
              : upstream.status === 402 ? "Crédits IA épuisés pour le moment."
              : upstream.status === 403 ? "L'assistant n'est pas disponible pour le moment."
              : "La génération a échoué.";
            return new Response(msg, { status: upstream.status });
          }
          return new Response(upstream.body, { status: 200, headers });
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw error;
        }
      },
    },
  },
});
