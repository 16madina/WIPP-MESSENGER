import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type CallInfo = { media: "audio" | "video"; missed: boolean; duration?: number; dir: "in" | "out"; group?: boolean };

function minutes(sec?: number) {
  if (!sec) return "";
  if (sec < 60) return `${Math.round(sec)} s`;
  return `${Math.round(sec / 60)} min`;
}

/** Événement d'appel inscrit dans la conversation ; toucher = rappeler. */
export function CallEvent({ call, at, onCall }: { call: CallInfo; at: number; onCall?: () => void }) {
  const Icon = call.missed ? PhoneMissed : call.group ? Users : call.media === "video" ? Video : call.dir === "in" ? PhoneIncoming : PhoneOutgoing;
  const title = call.missed ? "Appel manqué" : call.group ? "Appel de groupe" : call.media === "video" ? "Appel vidéo" : "Appel audio";
  const time = new Date(at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="my-2 flex justify-center">
      <button
        type="button"
        onClick={onCall}
        className={cn(
          "press glass-card flex min-h-11 items-center gap-2.5 rounded-2xl py-2 pr-4 pl-2.5 text-left",
          call.missed && "outline outline-1 outline-danger/35",
        )}
      >
        <span className={cn("flex size-8 items-center justify-center rounded-full", call.missed ? "bg-danger/12 text-danger" : "bg-accent/15 text-accent")}>
          <Icon className="size-4" />
        </span>
        <span>
          <span className={cn("block text-[14px] font-semibold", call.missed && "text-danger")}>{title}</span>
          <span className="block text-[12px] text-muted">
            {[minutes(call.duration), time].filter(Boolean).join(" · ")}
          </span>
        </span>
        <Phone className="ml-1 size-4 text-muted" />
      </button>
    </div>
  );
}
