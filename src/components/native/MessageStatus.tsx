import { motion } from "framer-motion";

export type MessageState = "sending" | "sent" | "delivered" | "read" | "failed";

const Dot = ({ className }: { className: string }) => (
  <span className={`block h-1.5 w-1.5 rounded-full ${className}`} />
);

/** Indicateurs WIPP : pulsant=envoi, 1 gris=envoyé, 2 gris=reçu, 2 jaunes reliés=lu, rouge=échec. */
export function MessageStatus({ state }: { state: MessageState }) {
  if (state === "sending")
    return (
      <motion.span
        aria-label="Envoi"
        className="block h-1.5 w-1.5 rounded-full bg-wipp-grey"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    );
  if (state === "failed") return <Dot className="bg-wipp-danger" />;
  if (state === "sent") return <span aria-label="Envoyé"><Dot className="bg-wipp-grey" /></span>;
  if (state === "delivered")
    return (
      <span aria-label="Reçu" className="flex gap-0.5">
        <Dot className="bg-wipp-grey" />
        <Dot className="bg-wipp-grey" />
      </span>
    );
  return (
    <span aria-label="Lu" className="relative flex items-center gap-1">
      <span className="absolute left-0.5 right-0.5 h-0.5 rounded-full bg-wipp-read" />
      <Dot className="relative bg-wipp-read" />
      <Dot className="relative bg-wipp-read" />
    </span>
  );
}
