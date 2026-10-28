"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";
import { Magnetic, RollText, Scramble } from "./ui";

const links = [
  { href: "/packages", label: "Tours" },
  { href: "/#deals", label: "Offers" },
  { href: "/#destinations", label: "Destinations" },
  { href: "/#how", label: "How it works" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  const bar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const introDone = useIntroDone();
  const pathname = usePathname();

  // slide in after intro, hide on scroll down / show on scroll up
  useGSAP(
    () => {
      if (!introDone) return;
      const isHome = pathname === "/";
      if (isHome) gsap.set(bar.current, { yPercent: -120 });
      else gsap.from(bar.current, { yPercent: -120, duration: 1.2, ease: "expo.out", delay: 0.4 });
      const show = gsap.quickTo(bar.current, "yPercent", { duration: 0.5, ease: "power3" });
      const top = () => (isHome ? window.innerHeight * 0.85 : 120);
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => show(self.scroll() < top() ? (isHome ? -120 : 0) : self.direction === 1 ? -120 : 0),
      });
    },
    { dependencies: [introDone, pathname] },
  );

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true });
      tl.set(menu.current, { display: "flex" })
        .fromTo(
          menu.current,
          { clipPath: "circle(0% at 100% 0%)" },
          { clipPath: "circle(150% at 100% 0%)", duration: 0.9, ease: "expo.inOut" },
        )
        .from("[data-menu-item]", { yPercent: 120, opacity: 0, stagger: 0.07, duration: 0.8, ease: "expo.out" }, "-=0.4");
      if (open) tl.play();
      else gsap.to(menu.current, { clipPath: "circle(0% at 100% 0%)", duration: 0.6, ease: "expo.inOut", onComplete: () => gsap.set(menu.current, { display: "none" }) });
    },
    { dependencies: [open], scope: menu },
  );

  // close on navigation
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <header ref={bar} className="fixed inset-x-0 top-0 z-50 px-5 py-5 md:px-10">
        <nav className="frost-glass mx-auto flex max-w-7xl items-center justify-between rounded-full py-2.5 pl-6 pr-2.5">
          <Link href="/" className="flex items-center gap-3" data-cursor="Home">
            <span className="relative size-6 rotate-45 border border-glow">
              <span className="absolute inset-1 bg-glow/60" />
            </span>
            <Scramble className="label text-[13px] font-semibold text-ice">AL SAFR</Scramble>
          </Link>
          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="label text-ice/80 hover:text-ice">
                  <RollText>{l.label}</RollText>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Magnetic>
              <Link
                href="/packages"
                className="hidden rounded-full bg-ice px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition-colors hover:bg-glow sm:inline-block"
              >
                <RollText>Find a tour</RollText>
              </Link>
            </Magnetic>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="relative z-[70] flex size-10 flex-col items-center justify-center gap-1.5 rounded-full border border-ice/20 lg:hidden"
            >
              <span className={`h-px w-4 bg-ice transition-transform duration-500 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
              <span className={`h-px w-4 bg-ice transition-transform duration-500 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>
      </header>

      <div
        ref={menu}
        className="fixed inset-0 z-[45] hidden flex-col justify-center gap-4 bg-night px-8"
        style={{ clipPath: "circle(0% at 100% 0%)" }}
      >
        {links.map((l, i) => (
          <div key={l.href} className="overflow-hidden">
            <Link data-menu-item href={l.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 text-5xl font-light">
              <span className="label text-glow">0{i + 1}</span>
              {l.label}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
