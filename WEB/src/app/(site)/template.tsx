"use client";

import { motion } from "motion/react";

// Re-mounts on every navigation: an ice curtain sweeps off the new page.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] origin-top bg-glow"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[79] origin-top bg-ink"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.9, delay: 0.12, ease: [0.76, 0, 0.24, 1] }}
      />
      {/* opacity only: a transform here would break ScrollTrigger pinning */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
        {children}
      </motion.div>
    </>
  );
}
