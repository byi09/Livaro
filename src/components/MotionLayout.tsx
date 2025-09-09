"use client";

import { AnimatePresence, motion } from "framer-motion";
import GlobalLoaderOverlay from "./GlobalLoaderOverlay";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface MotionLayoutProps {
  children: ReactNode;
}

const variants = {
  initial: { opacity: 0, y: 4, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -4, scale: 0.995, transition: { duration: 0.12, ease: "easeIn" } },
};

// Even faster variant specifically for heavy pages like the student dashboard
const fastVariants = {
  initial: { opacity: 0, y: 2, scale: 0.997 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.1, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -2, scale: 0.997, transition: { duration: 0.08, ease: "easeIn" } },
};

export default function MotionLayout({ children }: MotionLayoutProps) {
  const pathname = usePathname();
  const useFast = pathname?.includes("/student-dashboard");
  const appliedVariants = useFast ? fastVariants : variants;
  return (
    // Remove "wait" mode so enter/exit overlap for snappier transitions
    <AnimatePresence>
      <motion.div
        key={pathname}
        variants={appliedVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen flex flex-col"
      >
        {children}
      </motion.div>
      <GlobalLoaderOverlay />
    </AnimatePresence>
  );
}
