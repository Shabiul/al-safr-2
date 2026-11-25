"use client";

import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ScrollTrigger } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";
import { promoScope } from "@/data/updates";
import { useSite } from "./ContentProvider";

/* ---------- small shared bits ---------- */

/** ticks every second on the client; null during SSR so server and client markup match */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

export function Countdown({ to, compact = false }: { to: string; compact?: boolean }) {
  const now = useNow();
  const left = now === null ? null : Math.max(0, new Date(to).getTime() - now);
  const parts =
    left === null
      ? ["--", "--", "--", "--"]
      : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60].map((n) => String(n).padStart(2, "0"));
  if (compact) return <span className="tabular-nums">{`${parts[0]}d ${parts[1]}:${parts[2]}:${parts[3]}`}</span>;
  return (
    <span className="inline-flex gap-1.5 tabular-nums">
      {parts.map((v, i) => (
        <span key={i} className="flex flex-col items-center rounded-lg bg-ice px-2 py-1 text-ink">
          <motion.span key={v} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-mono text-base font-semibold leading-none">
            {v}
          </motion.span>
          <span className="text-[9px] uppercase tracking-widest opacity-70">{["days", "hrs", "min", "sec"][i]}</span>
        </span>
      ))}
    </span>
  );
}

/* ---------- top alert bar ---------- */

const BAR_KEY = "alsafr-bar-closed";
const barListeners = new Set<() => void>();
const barClosed = () => {
  try {
    return sessionStorage.getItem(BAR_KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeBar = (l: () => void) => {
  barListeners.add(l);
  return () => barListeners.delete(l);
};

export function AlertBar() {
  const site = useSite();
  // the strip runs the CRM announcements, then every package on offer and the latest news, so those sections stay current without extra editing
  const ALERTS = useMemo(
    () => [
      ...site.alerts,
      ...site.deals.slice(0, 6).map((p) => ({
        id: `deal-${p.slug}`,
        tone: "deal" as const,
        text: `${p.title}, ${p.country}: now $${p.price.toLocaleString("en-US")}${p.was ? ` (was $${p.was.toLocaleString("en-US")})` : ""} per person`,
        href: `/packages/${p.slug}`,
        cta: "View deal",
      })),
      ...site.news.slice(0, 4).map((n, k) => ({ id: `news-${k}-${n.title}`, tone: "news" as const, text: n.title, href: n.href || undefined, cta: "Read" })),
    ],
    [site],
  );
  const closed = useSyncExternalStore(subscribeBar, barClosed, () => false);

  // the bar's height feeds the fixed nav and the hero so nothing sits underneath it
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--bar-h", closed ? "0px" : "36px");
  }, [closed]);

  const close = () => {
    try {
      sessionStorage.setItem(BAR_KEY, "1");
    } catch {}
    barListeners.forEach((l) => l());
  };

  const item = (a: (typeof ALERTS)[number]) => (
    <span key={a.id} className="flex shrink-0 items-center gap-3 pr-14">
      <span className="label text-[10px] opacity-70">{a.tone === "deal" ? "🔥 Hot deal" : a.tone === "news" ? "📰 News" : a.tone === "new" ? "✦ New" : "ⓘ Info"}</span>
      <span className="whitespace-nowrap">{a.text}</span>
      {a.href && (
        <Link href={a.href} className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80">
          {a.cta ?? "More"} →
        </Link>
      )}
    </span>
  );
  return (
    <AnimatePresence>
      {!closed && (
        <motion.div
          initial={{ y: -36 }}
          animate={{ y: 0 }}
          exit={{ y: -36 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-x-0 top-0 z-[58] flex h-9 items-center justify-between gap-4 overflow-hidden bg-ice px-4 text-[12px] text-ink md:px-10"
          role="region"
          aria-label="Announcements"
        >
          {/* two copies side by side; the track slides left by exactly one copy, so the loop is seamless */}
          <div className="relative h-9 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)]">
            <div className="marquee flex h-9 w-max items-center hover:[animation-play-state:paused]" style={{ "--speed": `${Math.max(30, ALERTS.length * 9)}s` } as React.CSSProperties}>
              <div className="flex items-center">{ALERTS.map(item)}</div>
              <div className="flex items-center" aria-hidden>
                {ALERTS.map(item)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={close} aria-label="Dismiss announcements" className="text-base opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- notification bell ---------- */

const READ_KEY = "alsafr-read";
const readListeners = new Set<() => void>();
const readStore = {
  get: () => {
    try {
      return localStorage.getItem(READ_KEY) ?? "";
    } catch {
      return "";
    }
  },
  set: (v: string) => {
    try {
      localStorage.setItem(READ_KEY, v);
    } catch {}
    readListeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    readListeners.add(l);
    return () => readListeners.delete(l);
  },
};

const ago = (iso: string, now: number) => {
  const m = Math.round((now - new Date(iso).getTime()) / 6e4);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

const ICON = { price: "↓", departure: "✈", event: "✦", news: "◉" };

export function NotificationBell() {
  const { notifications: NOTIFICATIONS } = useSite();
  const [open, setOpen] = useState(false);
  const readRaw = useSyncExternalStore(readStore.subscribe, readStore.get, () => "");
  const read = new Set(readRaw.split(",").filter(Boolean));
  const unread = NOTIFICATIONS.filter((n) => !read.has(n.id)).length;
  const now = useNow();

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const markAll = () => readStore.set(NOTIFICATIONS.map((n) => n.id).join(","));
  const markOne = (id: string) => readStore.set([...read, id].join(","));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative flex size-10 items-center justify-center rounded-full border border-ice/20 transition-colors hover:border-glow"
      >
        <motion.svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" animate={unread ? { rotate: [0, -14, 12, -8, 6, 0] } : {}} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 4 }}>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-sand text-[10px] font-bold text-ink">
            {unread}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="frost-glass absolute right-0 top-12 w-[min(360px,90vw)] origin-top-right overflow-hidden rounded-2xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-ice/10 px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <button onClick={markAll} className="label text-[10px] text-glow hover:underline">
                Mark all read
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {NOTIFICATIONS.map((n, k) => (
                <motion.li key={n.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.05 }}>
                  <Link
                    href={n.href}
                    onClick={() => {
                      markOne(n.id);
                      setOpen(false);
                    }}
                    className={`flex gap-3 border-b border-ice/5 px-4 py-3 transition-colors hover:bg-glow/5 ${read.has(n.id) ? "opacity-60" : ""}`}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-glow/15 text-sm text-glow">{ICON[n.kind]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{n.title}</span>
                        {!read.has(n.id) && <span className="size-2 shrink-0 rounded-full bg-sand" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-ice/60">{n.body}</span>
                      <span className="mt-1 block text-[10px] text-ice/40">{now ? ago(n.when, now) : ""}</span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- one-time hot-deal toast ---------- */

const TOAST_KEY = "alsafr-toast-seen";

export function DealToast() {
  const { deals, settings } = useSite();
  const introDone = useIntroDone();
  const [show, setShow] = useState(false);
  const deal = deals[0];

  useEffect(() => {
    if (!introDone) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(TOAST_KEY) === "1";
    } catch {}
    if (seen) return;
    const id = setTimeout(() => setShow(true), 7000);
    return () => clearTimeout(id);
  }, [introDone]);

  const close = () => {
    setShow(false);
    try {
      sessionStorage.setItem(TOAST_KEY, "1");
    } catch {}
  };

  return (
    <AnimatePresence>
      {show && deal && (
        <motion.aside
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          className="frost-glass fixed bottom-5 right-5 z-[70] flex w-[min(360px,calc(100vw-40px))] gap-3 overflow-hidden rounded-2xl p-3"
          role="status"
        >
          <span aria-hidden className="border-beam" />
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
            <Image src={deal.image} alt="" fill sizes="80px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1 pr-5">
            <p className="label text-[10px] text-sand">🔥 Hot deal · ends in <Countdown to={settings.hotDealEnds} compact /></p>
            <p className="mt-1 truncate font-semibold">{deal.title}</p>
            <p className="text-xs text-ice/60">
              Save ${(deal.was! - deal.price).toLocaleString("en-US")} per person · {deal.country}
            </p>
            <Link href={`/packages/${deal.slug}`} onClick={close} className="label mt-2 inline-block text-[10px] text-glow hover:underline">
              View deal →
            </Link>
          </div>
          <button onClick={close} aria-label="Dismiss deal" className="absolute right-2 top-1 text-lg text-ice/50 hover:text-ice">
            ×
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ---------- promo codes strip ---------- */

export function PromoCodes() {
  const { promos: PROMOS, packages } = useSite();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
  };
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 md:px-10">
      <p className="label mb-5 text-glow">[ % ] Discount codes</p>
      <div className="grid gap-4 md:grid-cols-3">
        {PROMOS.map((p, i) => (
          <motion.div
            key={p.code}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-dashed border-ice/25 bg-night p-6"
          >
            <span aria-hidden className="border-beam" style={{ animationDelay: `${-i * 1.3}s` }} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold text-sand">{p.off}</p>
                <p className="mt-1 font-semibold">{p.title}</p>
                <p className="text-sm text-ice/60">{p.detail}</p>
                <p className="mt-2 text-xs font-medium text-glow">{promoScope(p, (s) => packages.find((x) => x.slug === s)?.title)}</p>
              </div>
              <span className="label rounded-full bg-sand/15 px-2.5 py-1 text-[10px] text-sand">Ends in <Countdown to={p.endsAt} compact /></span>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-ice/15 bg-ink px-4 py-3 font-mono text-sm tracking-[0.2em]">{p.code}</code>
              <button onClick={() => copy(p.code)} className="relative overflow-hidden rounded-xl bg-ice px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-glow">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={copied === p.code ? "y" : "n"} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="block">
                    {copied === p.code ? "Copied ✓" : "Copy"}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
            <Link href={p.href} className="label mt-4 inline-block text-[10px] text-glow hover:underline">
              Browse eligible tours →
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- scroll-linked page background ---------- */

const TINTS: [string, string][] = [
  ["#styles", "paper"],
  ["#packages", "aqua"],
  ["#deals", "sand"],
  ["#book", "aqua"],
  ["#departures", "lilac"],
  ["#destinations", "aqua"],
  ["#news", "sage"],
  ["#collection", "paper"],
  ["#included", "aqua"],
  ["#how", "sage"],
  ["#reviews", "sand"],
  ["#contact", "lilac"],
];

/** eases the page background to each section's tint as it reaches the middle of the screen */
export function ScrollTint() {
  useEffect(() => {
    const root = document.documentElement;
    const set = (t: string) => root.style.setProperty("--page-bg", `var(--tint-${t})`);
    const triggers = TINTS.flatMap(([sel, tint], i) => {
      const el = document.querySelector(sel);
      if (!el) return [];
      const prev = TINTS[i - 1]?.[1] ?? "paper";
      return [ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onEnter: () => set(tint), onEnterBack: () => set(tint), onLeaveBack: () => set(prev) })];
    });
    return () => {
      triggers.forEach((t) => t.kill());
      root.style.removeProperty("--page-bg");
    };
  }, []);
  return null;
}
