"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";
import { Magnetic, RollText, Scramble } from "./ui";
import { BOOKING_FORMS, BOOK_TABS } from "@/data/updates";
import { useSite } from "./ContentProvider";
import { NotificationBell } from "./SiteChrome";

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
  // Flights / Hotels / Buses / Trains: each opens its request form in the "Book it yourself" slider (switched on or off in the CRM)
  const forms = { ...BOOKING_FORMS, ...useSite().forms };
  const all = [
    ...BOOK_TABS.filter((t) => forms[t.on]).map((t) => ({ href: `/#book-${t.id}`, label: t.label, tab: t.id as string })),
    ...links.map((l) => ({ ...l, tab: "" })),
  ];
  const openTab = (tab: string) => tab && window.dispatchEvent(new CustomEvent("book-tab", { detail: tab }));
  // the fade behind the pill only shows once content is scrolling under it (it would tint the hero photo)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // pinned: slides in once after the intro, then stays put while scrolling
  useGSAP(
    () => {
      if (introDone) gsap.from(bar.current, { yPercent: -120, duration: 1.2, ease: "expo.out", delay: 0.4 });
    },
    { dependencies: [introDone] },
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
      <header ref={bar} className="fixed inset-x-0 z-50 px-5 py-4 transition-[top] duration-300 md:px-10" style={{ top: "var(--bar-h, 0px)" }}>
        {/* page-coloured fade behind the floating pill, so content scrolling up never shows in the gap above it */}
        <div aria-hidden className={`pointer-events-none absolute inset-x-0 -top-px h-[calc(100%+12px)] bg-[linear-gradient(to_bottom,var(--page-bg,var(--ink))_55%,transparent)] transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`} />
        <nav className="frost-glass nav-glass relative mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2">
          <Link href="/" className="flex shrink-0 items-center gap-3" data-cursor="Home">
            <span className="relative size-6 rotate-45 border border-glow">
              <span className="absolute inset-1 bg-glow/60" />
            </span>
            <Scramble className="label text-[13px] font-semibold leading-none text-ice">AL SAFR</Scramble>
          </Link>
          <ul className="hidden items-center gap-6 xl:flex xl:gap-7">
            {all.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => openTab(l.tab)} className="label flex items-center leading-none text-ice/80 hover:text-ice">
                  <RollText>{l.label}</RollText>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
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
              className="relative z-[70] flex size-10 flex-col items-center justify-center gap-1.5 rounded-full border border-ice/20 xl:hidden"
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
        {all.map((l, i) => (
          <div key={l.href} className="overflow-hidden">
            <Link
              data-menu-item
              href={l.href}
              onClick={() => {
                setOpen(false);
                openTab(l.tab);
              }}
              className="flex items-baseline gap-4 text-4xl font-light sm:text-5xl"
            >
              <span className="label text-glow">0{i + 1}</span>
              {l.label}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
