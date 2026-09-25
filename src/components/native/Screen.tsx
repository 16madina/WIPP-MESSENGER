import { useScroll } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { NavHeader } from "./NavHeader";

type Props = {
  title: string;
  large?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  bottomInset?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/** Écran défilant avec NavHeader. */
export function Screen({ title, large = true, onBack, right, bottomInset = true, children, footer }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: ref });
  return (
    <div className="flex h-full flex-col bg-wipp-bg">
      <div ref={ref} className="no-scrollbar relative flex-1 overflow-y-auto">
        <NavHeader title={title} scrollY={scrollY} large={large} onBack={onBack} right={right} />
        <div style={{ paddingBottom: bottomInset ? "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)" : 16 }}>
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}
