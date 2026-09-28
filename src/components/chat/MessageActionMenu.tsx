import { useState, type ReactNode } from "react";
import { ArrowLeft, CircleEllipsis } from "lucide-react";
import { motion } from "framer-motion";
import { Btn } from "@/components/ui";
import { layout, motion as wippMotion } from "@/theme/theme";

export type MessageMenuAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
};

type Props = {
  anchor: DOMRect;
  container: HTMLElement | null;
  reactions?: { emojis: string[]; onSelect: (emoji: string) => void };
  actions: MessageMenuAction[];
  onClose: () => void;
};

/** Compact, bubble-anchored action palette. The conversation stays visible underneath. */
export function MessageActionMenu({ anchor, container, reactions, actions, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!container) return null;
  const bounds = container.getBoundingClientRect();
  const width = Math.min(284, bounds.width - 32);
  const left = Math.max(16, Math.min(anchor.left - bounds.left, bounds.width - width - 16));
  const rowHeight = layout.menuItemHeight;
  const primaryKeys = ["reply", "forward", "copy", "pin", "delete"];
  const primary = primaryKeys.map((key) => actions.find((a) => a.key === key)).filter((a): a is MessageMenuAction => Boolean(a));
  const extra = actions.filter((a) => !primary.some((p) => p.key === a.key));
  const shown = expanded ? extra : primary;
  const menuHeight = (expanded ? Math.min(extra.length, 6) + 1 : primary.length + (extra.length ? 1 : 0)) * rowHeight;
  const gap = 8;
  const reactionHeight = reactions ? 48 + gap : 0;
  const bubbleBottom = anchor.bottom - bounds.top;
  const bubbleTop = anchor.top - bounds.top;
  const below = bubbleBottom + gap + menuHeight <= bounds.height - 24;
  const idealTop = below ? bubbleBottom + gap : bubbleTop - menuHeight - gap;
  const top = Math.max(60 + reactionHeight, Math.min(idealTop, bounds.height - menuHeight - 20));
  const reactionTop = Math.max(54, Math.min(bubbleTop - reactionHeight, top - reactionHeight));
  const run = (action: MessageMenuAction) => {
    onClose();
    action.onSelect();
  };

  return (
    <div className="absolute inset-0 z-30" role="presentation">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      {reactions && (
        <motion.div
          role="group"
          aria-label="Réactions"
          className="absolute flex h-12 max-w-[calc(100%-32px)] items-center justify-around gap-0.5 rounded-full border border-wipp-glass-border bg-wipp-elevated px-1 shadow-lift"
          style={{ top: reactionTop, left, width: Math.min(width + 32, bounds.width - 32) }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={wippMotion.lift}
        >
          {reactions.emojis.map((emoji) => (
            <Btn key={emoji} variant="ghost" className="h-11 min-h-11 min-w-0 flex-1 rounded-full px-0 text-[24px]" aria-label={`Réagir avec ${emoji}`} onClick={() => { onClose(); reactions.onSelect(emoji); }}>{emoji}</Btn>
          ))}
        </motion.div>
      )}
      <motion.div
        role="menu"
        aria-label={expanded ? "Plus d’actions" : "Actions du message"}
        className="absolute overflow-hidden rounded-[14px] border border-wipp-glass-border bg-wipp-elevated text-wipp-fg shadow-lift"
        style={{ top, left, width }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={wippMotion.lift}
      >
        {expanded && <Btn variant="ghost" role="menuitem" className="h-11 w-full justify-start gap-3 rounded-none border-b border-wipp-sep px-4 text-[15px]" onClick={() => setExpanded(false)}><ArrowLeft size={18} /> Retour</Btn>}
        <div className={expanded ? "max-h-[264px] overflow-y-auto overscroll-contain" : undefined}>
          {shown.map((action) => (
            <Btn
              key={action.key}
              variant="ghost"
              role="menuitem"
              className={`h-11 w-full justify-start gap-3 rounded-none px-4 text-[15px] ${action.danger ? "text-wipp-danger" : "text-wipp-fg"}`}
              onClick={() => run(action)}
            >
              <span className="flex w-5 shrink-0 items-center justify-center">{action.icon}</span>
              <span className="truncate">{action.label}</span>
            </Btn>
          ))}
        </div>
        {!expanded && extra.length > 0 && <Btn variant="ghost" role="menuitem" className="h-11 w-full justify-start gap-3 rounded-none border-t border-wipp-sep px-4 text-[15px] text-wipp-fg" onClick={() => setExpanded(true)}><CircleEllipsis size={20} /> Plus…</Btn>}
      </motion.div>
    </div>
  );
}
