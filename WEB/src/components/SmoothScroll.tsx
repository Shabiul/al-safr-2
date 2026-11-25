"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { MotionGlobalConfig } from "motion/react";
import { useIntroDone } from "@/lib/intro";
import { useReduceMotion } from "@/lib/theme";

let instance: Lenis | null = null;

/** px from the top of the window to the bottom of the pinned navbar */
export const navBottom = () => document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;

/** smooth-scroll to an element through Lenis (a plain window.scrollTo gets overridden by it) */
export const scrollToEl = (el: HTMLElement, offset = 0, onComplete?: () => void) => instance?.scrollTo(el, { offset, duration: 1.4, onComplete });

/** jump straight there, no animation (used to correct a landing spot after the layout moved) */
export const snapToEl = (el: HTMLElement, offset = 0) => instance?.scrollTo(el, { offset, immediate: true, force: true });

export default function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const introDone = useIntroDone();
  const pathname = usePathname();
  const reduce = useReduceMotion();

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

  // "Reduce motion" from the display panel: native scrolling, motion skips straight to end states,
  // and GSAP tweens finish almost instantly (ScrollTrigger-scrubbed ones still follow the scroll)
  useEffect(() => {
    if (lenis.current) lenis.current.options.smoothWheel = !reduce;
    MotionGlobalConfig.skipAnimations = reduce;
    gsap.globalTimeline.timeScale(reduce ? 20 : 1);
  }, [reduce]);

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
