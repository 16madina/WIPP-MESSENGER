export function Avatar({ name, size = 52, online }: { name: string; size?: number; online?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center rounded-full bg-wipp-elevated font-display font-bold text-wipp-accent"
        style={{ fontSize: size * 0.38 }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      {online && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-wipp-bg bg-wipp-accent" />}
    </span>
  );
}
