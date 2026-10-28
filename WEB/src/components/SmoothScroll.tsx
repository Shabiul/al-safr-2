"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";

let instance: Lenis | null = null;

/** smooth-scroll to an element through Lenis (a plain window.scrollTo gets overridden by it) */
export const scrollToEl = (el: HTMLElement, offset = 0) => instance?.scrollTo(el, { offset, duration: 1.4 });

export default function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const introDone = useIntroDone();
  const pathname = usePathname();

  useEffect(() => {
    const l = new Lenis({ autoRaf: false, lerp: 0.09, anchors: true });
    lenis.current = instance = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
    };
  }, []);

  useEffect(() => {
    if (introDone) lenis.current?.start();
    else lenis.current?.stop();
  }, [introDone]);

  useEffect(() => {
    lenis.current?.scrollTo(0, { immediate: true, force: true });
    // new page = new layout heights
    const id = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
