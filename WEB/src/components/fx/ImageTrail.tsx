"use client";

// Adapted from "Image Trail" by nexus-ui on 21st.dev (https://21st.dev/r/nexus-ui/image-trail):
// trimmed to mouse-only (touch would block page scrolling), framer-motion → motion, no cn/shadcn deps.
import { useCallback, useEffect, useRef, useState, startTransition, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type Entry = { id: number; x: number; y: number; t: number; img: number };

export default function ImageTrail({
  images,
  spacing = 70,
  duration = 1100,
  imageSize = 150,
  max = 24,
  className = "",
  children,
}: {
  images: { src: string; alt?: string }[];
  spacing?: number;
  duration?: number;
  imageSize?: number;
  max?: number;
  className?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion() === true;
  const box = useRef<HTMLDivElement>(null);
  const last = useRef({ x: -999, y: -999 });
  const ids = useRef(0);
  const [trail, setTrail] = useState<Entry[]>([]);

  const onMove = useCallback(
    (e: MouseEvent) => {
      const r = box.current!.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (Math.hypot(x - last.current.x, y - last.current.y) < spacing) return;
      last.current = { x, y };
      const id = ids.current++;
      startTransition(() => setTrail((prev) => [{ id, x, y, t: Date.now(), img: id % images.length }, ...prev].slice(0, max)));
    },
    [spacing, images.length, max],
  );

  useEffect(() => {
    const el = box.current!;
    if (reduce) return;
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [onMove, reduce]);

  // drop entries once they have lived their duration; AnimatePresence fades them out
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      startTransition(() => setTrail((prev) => (prev.some((e) => now - e.t >= duration) ? prev.filter((e) => now - e.t < duration) : prev)));
    }, 80);
    return () => clearInterval(id);
  }, [duration]);

  return (
    <div ref={box} className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout">
        {trail.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, scale: 0.6, rotate: (e.id % 2 ? 1 : -1) * 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, rotate: (e.id % 2 ? 1 : -1) * 3, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(8px)" }}
            transition={{ duration: 0.35, ease: "easeOut", opacity: { duration: 0.4 } }}
            className="pointer-events-none absolute overflow-hidden rounded-2xl shadow-[0_20px_40px_-15px_rgba(11,26,43,.5)]"
            style={{ left: e.x - imageSize / 2, top: e.y - imageSize * 0.62, width: imageSize, height: imageSize * 1.25, zIndex: trail.length - i }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[e.img].src} alt={images[e.img].alt ?? ""} draggable={false} className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="relative z-[30]">{children}</div>
    </div>
  );
}
