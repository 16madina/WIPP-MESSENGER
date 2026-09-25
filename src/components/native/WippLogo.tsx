/** Logo WIPP provisoire (texte + trait jaune), stocké dans le projet. */
export function WippLogo({ height = 34 }: { height?: number }) {
  return (
    <span className="relative inline-flex flex-col items-start leading-none" style={{ height }}>
      <span className="font-display font-extrabold tracking-tight text-wipp-fg" style={{ fontSize: height * 0.95, lineHeight: 0.9 }}>
        wipp
      </span>
      <svg viewBox="0 0 100 12" className="-mt-0.5 text-wipp-accent" style={{ width: height * 2.4, height: height * 0.28 }}>
        <path d="M3 8 Q50 1 97 6" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}
