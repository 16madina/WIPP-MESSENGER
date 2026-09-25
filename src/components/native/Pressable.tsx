import { motion, type HTMLMotionProps } from "framer-motion";
import { motion as m } from "@/theme/theme";

type Props = HTMLMotionProps<"button"> & { scale?: number };

/** Bouton natif : réduction à 0.97 à l'appui, aucun effet de survol. */
export function Pressable({ scale = m.pressScale, className = "", ...rest }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale }}
      transition={m.spring}
      className={`select-none outline-none ${className}`}
      {...rest}
    />
  );
}
