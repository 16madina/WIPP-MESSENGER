import type { ReactNode } from "react";

export type Presence = "online" | "active" | "busy" | undefined;

const presenceClass = { online: "bg-wipp-accent", active: "bg-wipp-success", busy: "bg-wipp-danger" };

type Props = {
  name: string;
  size?: number;
  online?: boolean | undefined;
  presence?: Presence;
  ring?: boolean;
  badge?: ReactNode;
};

/** Avatar à initiale (photo à venir), anneau jaune optionnel, pastille de présence ou badge. */
export function Avatar({ name, size = 52, online, presence, ring, badge }: Props) {
  const p: Presence = presence ?? (online ? "online" : undefined);
  const dot = Math.max(10, size * 0.2);
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span className={`flex h-full w-full rounded-full ${ring ? "border-2 border-wipp-accent p-[3px]" : ""}`}>
        <span
          className="flex h-full w-full items-center justify-center rounded-full bg-wipp-elevated font-display font-bold text-wipp-accent"
          style={{ fontSize: size * 0.36 }}
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      </span>
      {badge ? (
        <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-wipp-bg bg-wipp-accent text-wipp-accent-fg" style={{ width: size * 0.34, height: size * 0.34 }}>
          {badge}
        </span>
      ) : p ? (
        <span className={`absolute bottom-[4%] right-[4%] rounded-full border-2 border-wipp-bg ${presenceClass[p]}`} style={{ width: dot, height: dot }} />
      ) : null}
    </span>
  );
}
