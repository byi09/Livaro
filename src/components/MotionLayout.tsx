"use client";

import { AnimatePresence, motion } from "framer-motion";
import GlobalLoaderOverlay from "./GlobalLoaderOverlay";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface MotionLayoutProps {
  children: ReactNode;
}

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function MotionLayout({ children }: MotionLayoutProps) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} variants={variants} initial="initial" animate="animate" exit="exit" className="min-h-screen flex flex-col">
        {children}
      </motion.div>
      <GlobalLoaderOverlay />
    </AnimatePresence>
  );
}
