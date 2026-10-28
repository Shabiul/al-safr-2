"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

// Ring + dot cursor. Any element with data-cursor="Label" grows the ring and shows the label.
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");

    const rx = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3" });
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.1 });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.1 });

    const move = (e: PointerEvent) => {
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button, input, textarea, select");
      const text = t?.dataset.cursor ?? "";
      setLabel(text);
      gsap.to(ring.current, {
        scale: t ? (text ? 2.6 : 1.6) : 1,
        backgroundColor: text ? "rgba(14,143,179,0.92)" : "rgba(14,143,179,0)",
        duration: 0.35,
        ease: "power3",
      });
    };
    const down = () => gsap.to(ring.current, { scale: "*=0.8", duration: 0.15, yoyo: true, repeat: 1 });

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", down);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[90] -ml-5 -mt-5 flex size-10 items-center justify-center rounded-full border border-glow/70 [@media(pointer:coarse)]:hidden"
      >
        <span className="text-[6px] font-semibold uppercase tracking-[0.2em] text-ink">{label}</span>
      </div>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[91] -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-glow [@media(pointer:coarse)]:hidden"
      />
    </>
  );
}
