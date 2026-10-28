"use client";

import { useRef, type ReactNode, type ElementType } from "react";
import Link from "next/link";
import { gsap, useGSAP, ScrollTrigger, SplitText, SCRAMBLE_CHARS } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";

/** Element drifts toward the pointer while hovered. */
export function Magnetic({ children, strength = 0.35, className = "inline-block" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current!;
    const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * strength);
      y((e.clientY - r.top - r.height / 2) * strength);
    };
    const leave = () => {
      x(0);
      y(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  });
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}

/** Text that rolls to a duplicate of itself on hover. */
export function RollText({ children }: { children: string }) {
  return (
    <span className="group/roll relative inline-flex overflow-hidden">
      <span className="transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover/roll:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute left-0 top-full text-glow transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover/roll:-translate-y-full"
      >
        {children}
      </span>
    </span>
  );
}

/** Scrambles its text when it enters the viewport and on hover. */
export function Scramble({
  children,
  className,
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const introDone = useIntroDone();
  useGSAP(
    () => {
      if (!introDone) return;
      const el = ref.current!;
      const run = () =>
        gsap.to(el, { duration: 1, scrambleText: { text: children, chars: SCRAMBLE_CHARS, speed: 0.5 } });
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: run });
      el.addEventListener("pointerenter", run);
      return () => el.removeEventListener("pointerenter", run);
    },
    { dependencies: [introDone, children] },
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/** Splits text into lines/words/chars that rise into view on scroll. */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  type = "lines",
  delay = 0,
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  type?: "lines" | "words" | "chars";
  delay?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const introDone = useIntroDone();
  useGSAP(
    () => {
      if (!introDone) return;
      const split = SplitText.create(ref.current!, {
        type: type === "chars" ? "words,chars" : type,
        mask: type === "chars" ? "words" : type,
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self[type], {
            yPercent: 110,
            rotate: type === "chars" ? 8 : 2,
            opacity: 0,
            duration: type === "chars" ? 0.9 : 1.1,
            ease: "expo.out",
            stagger: type === "chars" ? 0.025 : 0.08,
            delay,
            scrollTrigger: immediate ? undefined : { trigger: ref.current, start: "top 88%" },
          }),
      });
      return () => split.revert();
    },
    { dependencies: [introDone] },
  );
  return (
    <Tag ref={ref} className={className} style={{ visibility: introDone ? "visible" : "hidden" }}>
      {children}
    </Tag>
  );
}

/** Infinite marquee that skews with scroll velocity. */
export function Marquee({
  items,
  reverse = false,
  speed = 40,
  className = "",
}: {
  items: ReactNode[];
  reverse?: boolean;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const skew = gsap.quickTo(ref.current, "skewX", { duration: 0.6, ease: "power3" });
    ScrollTrigger.create({
      trigger: ref.current,
      onUpdate: (self) => skew(gsap.utils.clamp(-12, 12, self.getVelocity() / -250)),
    });
  });
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="flex items-center">
          {it}
          <span className="mx-8 text-glow">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        ref={ref}
        className={`marquee flex w-max ${reverse ? "marquee-reverse" : ""}`}
        style={{ "--speed": `${speed}s` } as React.CSSProperties}
      >
        {row}
        {row}
      </div>
    </div>
  );
}

export function Button({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: string;
  variant?: "solid" | "ghost";
}) {
  return (
    <Magnetic>
      <Link
        href={href}
        className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-4 text-sm font-medium transition-colors duration-500 ${
          variant === "solid"
            ? "bg-ice text-ink hover:text-ink"
            : "border border-ice/25 text-ice hover:border-glow hover:text-ink"
        }`}
      >
        <span className="absolute inset-0 translate-y-full rounded-full bg-glow transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0" />
        <span className="relative">
          <RollText>{children}</RollText>
        </span>
        <span className="relative transition-transform duration-500 group-hover:rotate-45">↗</span>
      </Link>
    </Magnetic>
  );
}
