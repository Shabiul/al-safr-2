"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";
import { Magnetic, RollText, Scramble } from "./ui";
import { BOOKING_FORMS, BOOK_LINKS, BOOK_TABS, type BookLink } from "@/data/updates";
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
  // Flights / Hotels / Buses / Trains: clicking one offers instant booking (redirect) or a request (on-site form -> CRM lead).
  // Which services show, their links and their wording are all managed in the CRM (Website content).
  const site = useSite();
  const forms = { ...BOOKING_FORMS, ...site.forms };
  const services = BOOK_TABS.filter((t) => forms[t.on]).map((t) => ({ id: t.id, label: t.label, cfg: site.bookLinks?.find((b) => b.id === t.id) ?? BOOK_LINKS.find((b) => b.id === t.id)! }));
  const wa = (site.settings.whatsapp ?? "").replace(/\D/g, "");
  const [svc, setSvc] = useState<string | null>(null);
  const pick = () => setSvc(null);
  useEffect(() => {
    if (!svc) return;
    const away = (e: PointerEvent) => !(e.target as Element).closest("[data-svc]") && setSvc(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSvc(null);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [svc]);
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
            <Scramble className="label text-[13px] font-semibold leading-none text-ice">AL-SAFAR</Scramble>
          </Link>
          <ul className="hidden items-center gap-6 xl:flex xl:gap-7">
            {services.map((v) => (
              <li key={v.id} data-svc className="relative">
                <button
                  type="button"
                  onClick={() => setSvc(svc === v.id ? null : v.id)}
                  aria-expanded={svc === v.id}
                  aria-haspopup="menu"
                  className="label flex items-center gap-1.5 leading-none text-ice/80 hover:text-ice"
                >
                  {v.label}
                  <span aria-hidden className={`text-[9px] transition-transform ${svc === v.id ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                {svc === v.id && (
                  <div role="menu" className="frost-glass absolute left-1/2 top-full z-10 mt-5 w-80 -translate-x-1/2 rounded-3xl p-2">
                    <Choices id={v.id} label={v.label} cfg={v.cfg} wa={wa} done={pick} />
                  </div>
                )}
              </li>
            ))}
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="label flex items-center leading-none text-ice/80 hover:text-ice">
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
        className="fixed inset-0 z-[45] hidden flex-col gap-4 overflow-y-auto bg-night px-8 py-24 [&>*:first-child]:mt-auto [&>*:last-child]:mb-auto"
        style={{ clipPath: "circle(0% at 100% 0%)" }}
      >
        {services.map((v, i) => (
          <div key={v.id} data-svc>
            <div className="overflow-hidden">
              <button
                data-menu-item
                type="button"
                onClick={() => setSvc(svc === v.id ? null : v.id)}
                aria-expanded={svc === v.id}
                className="flex w-full items-baseline gap-4 text-left text-4xl font-light sm:text-5xl"
              >
                <span className="label text-glow">0{i + 1}</span>
                {v.label}
                <span aria-hidden className={`ml-auto self-center text-base transition-transform ${svc === v.id ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
            </div>
            {svc === v.id && (
              <div className="mt-2 rounded-3xl border border-ice/10 p-2">
                <Choices
                  id={v.id}
                  label={v.label}
                  cfg={v.cfg}
                  wa={wa}
                  done={() => {
                    pick();
                    setOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        ))}
        {links.map((l, i) => (
          <div key={l.href} className="overflow-hidden">
            <Link data-menu-item href={l.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 text-4xl font-light sm:text-5xl">
              <span className="label text-glow">0{services.length + i + 1}</span>
              {l.label}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

/** the two choices a service offers: redirect to instant booking, or send a request (the on-site form, saved as a CRM lead) */
function Choices({ id, label, cfg, wa, done }: { id: string; label: string; cfg: BookLink; wa: string; done: () => void }) {
  const row = "block rounded-2xl px-4 py-3 text-left transition-colors hover:bg-ice/10";
  const home = usePathname() === "/";
  return (
    <>
      {cfg.url && (
        <a role="menuitem" href={cfg.url} target="_blank" rel="noopener noreferrer" onClick={done} className={row}>
          <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ice">
            <span>⚡ {cfg.instantTitle}</span>
            <span aria-hidden className="text-glow">
              ↗
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-ice/60">{cfg.instantNote}</span>
        </a>
      )}
      {/* on the home page: switch the slider and scroll, without a hash link (Next and Lenis both handle those, which doubled the #… in the URL) */}
      {home ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            history.replaceState(history.state, "", `/#book-${id}`);
            window.dispatchEvent(new CustomEvent("book-tab", { detail: id }));
            done();
          }}
          className={`${row} w-full`}
        >
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ice">
          <span>✉ {cfg.requestTitle}</span>
          <span aria-hidden className="text-glow">
            →
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-ice/60">{cfg.requestNote}</span>
        </button>
      ) : (
        <Link role="menuitem" href={`/#book-${id}`} onClick={done} className={row}>
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ice">
          <span>✉ {cfg.requestTitle}</span>
          <span aria-hidden className="text-glow">
            →
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-ice/60">{cfg.requestNote}</span>
        </Link>
      )}
      {wa && (
        <a
          role="menuitem"
          href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi Al-Safar, I'd like help with ${label.toLowerCase()}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={done}
          className={row}
        >
          <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ice">
            <span>💬 Chat on WhatsApp</span>
            <span aria-hidden className="text-glow">
              ↗
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-ice/60">Talk to our Bangalore team right now</span>
        </a>
      )}
    </>
  );
}
