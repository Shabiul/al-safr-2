"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ScrollTrigger } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";
import { ACCENTS, SEASONS, resetPrefs, setPrefs, setTheme, usePrefs, useSeason, useTheme, type Season } from "@/lib/theme";
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

/* ---------- theme toggle ---------- */

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={`relative flex h-7 w-12 items-center rounded-full border border-ice/20 bg-ice/10 p-0.5 transition-colors ${className}`}
    >
      <motion.span layout transition={{ type: "spring", bounce: 0.35, duration: 0.5 }} className={`flex size-6 items-center justify-center rounded-full bg-night text-xs shadow ${dark ? "ml-auto" : ""}`}>
        {dark ? "☾" : "☀"}
      </motion.span>
    </button>
  );
}

/* ---------- display settings panel (appearance, colour, season, accessibility) ---------- */

const A11Y: { key: "large" | "contrast" | "reduce" | "underline"; name: string; hint: string }[] = [
  { key: "large", name: "Larger text", hint: "Increase text size across the site" },
  { key: "contrast", name: "High contrast", hint: "Stronger text and borders" },
  { key: "reduce", name: "Reduce motion", hint: "Turn off animations and smooth scroll" },
  { key: "underline", name: "Underline links", hint: "Make every link easy to spot" },
];

const noop = () => () => {};

/** "nav": round icon in the website navbar, panel drops from the top right.
 *  "sidebar": labelled row in the CRM sidebar, panel opens beside it (top right on phones, where the sidebar is a top bar). */
export function DisplayPanel({ placement = "nav" }: { placement?: "nav" | "sidebar" }) {
  const side = placement === "sidebar";
  const [open, setOpen] = useState(false);
  const prefs = usePrefs();
  const theme = useTheme();
  const season = useSeason();
  const accent = ACCENTS.find((a) => a.id === prefs.accent) ?? ACCENTS[0];
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Display settings: theme, colours and accessibility"
        aria-expanded={open}
        className={
          side
            ? "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ice/65 transition-colors hover:bg-ice/5 hover:text-ice"
            : "flex size-10 items-center justify-center rounded-full border border-ice/20 transition-colors hover:border-glow"
        }
      >
        <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 22Z" />
          <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
          <circle cx="11" cy="6.8" r="1" fill="currentColor" />
          <circle cx="16" cy="8" r="1" fill="currentColor" />
        </svg>
        {side && <span className="hidden md:inline">Display</span>}
      </button>
      {/* portalled: the nav header is transformed by GSAP, which would trap a fixed child */}
      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <>
            <div key="scrim" onClick={() => setOpen(false)} className="fixed inset-0 z-[70]" />
            <motion.div
              key="panel"
              role="dialog"
              aria-label="Display"
              initial={{ opacity: 0, y: side ? 10 : -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: side ? 10 : -10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={side ? undefined : { top: "calc(var(--bar-h, 0px) + 5.25rem)" }}
              className={`fixed z-[71] w-[min(380px,calc(100vw-2rem))] overflow-y-auto rounded-[28px] border border-ice/10 bg-night text-ice shadow-[0_30px_80px_-20px_rgba(0,0,0,.45)] ${
                side
                  ? "right-4 top-16 max-h-[calc(100vh-5rem)] origin-top-right md:bottom-6 md:left-[252px] md:right-auto md:top-auto md:max-h-[calc(100vh-3rem)] md:origin-bottom-left"
                  : "right-4 max-h-[calc(100vh-7rem)] origin-top-right md:right-10"
              }`}
              data-lenis-prevent
            >
              <div className="flex items-center justify-between px-6 py-5">
                <p className="text-lg font-bold tracking-tight">Display</p>
                <button onClick={() => setOpen(false)} aria-label="Close display settings" className="flex size-9 items-center justify-center rounded-full border border-ice/20 transition-colors hover:border-glow">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              </div>

              <section className="border-t border-ice/10 px-6 py-5">
                <p className="label mb-3 text-ice/60">Appearance</p>
                <div className="grid grid-cols-3 gap-1 rounded-2xl bg-ink p-1">
                  {(["light", "dark", "auto"] as const).map((m) => (
                    <button key={m} onClick={() => setPrefs({ mode: m })} aria-pressed={prefs.mode === m} className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm capitalize transition-colors ${prefs.mode === m ? "font-semibold text-ice" : "text-ice/60 hover:text-ice"}`}>
                      {prefs.mode === m && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-xl border border-ice/10 bg-night shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
                      <svg viewBox="0 0 24 24" className="relative size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {m === "light" ? (
                          <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
                        ) : m === "dark" ? (
                          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
                        ) : (
                          <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>
                        )}
                      </svg>
                      <span className="relative">{m}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="border-t border-ice/10 px-6 py-5">
                <p className="label mb-3 text-ice/60">Colour theme</p>
                <div className="flex gap-3">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setPrefs({ accent: a.id })}
                      aria-label={a.name}
                      aria-pressed={prefs.accent === a.id}
                      className="size-11 rounded-full transition-transform hover:scale-110"
                      style={{ background: theme === "dark" ? a.dark : a.light, boxShadow: prefs.accent === a.id ? `0 0 0 3px var(--night), 0 0 0 5px ${theme === "dark" ? a.dark : a.light}` : undefined }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm text-ice/60">{accent.name}</p>
              </section>

              <section className="border-t border-ice/10 px-6 py-5">
                <label className="label mb-3 block text-ice/60" htmlFor="season">
                  Seasonal theme
                </label>
                <div className="relative">
                  <select id="season" value={prefs.season} onChange={(e) => setPrefs({ season: e.target.value as Season })} className="w-full appearance-none rounded-2xl border border-ice/15 bg-ink px-4 py-3.5 pr-10 text-[15px] font-medium text-ice outline-none focus:border-glow">
                    <option value="auto">Automatic (by date)</option>
                    <option value="off">Off</option>
                    {SEASONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ice/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
                {prefs.season === "auto" && <p className="mt-2 text-xs text-ice/50">Showing now: {SEASONS.find((s) => s.id === season)?.name ?? "none"}</p>}
              </section>

              <section className="border-t border-ice/10 px-6 pb-6 pt-5">
                <p className="label mb-2 text-ice/60">Accessibility</p>
                {A11Y.map((o) => (
                  <button key={o.key} role="switch" aria-checked={prefs[o.key]} onClick={() => setPrefs({ [o.key]: !prefs[o.key] })} className="flex w-full items-center justify-between gap-4 py-2.5 text-left">
                    <span>
                      <span className="block text-[15px] font-medium">{o.name}</span>
                      <span className="block text-xs text-ice/55">{o.hint}</span>
                    </span>
                    <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${prefs[o.key] ? "bg-glow" : "bg-ice/20"}`}>
                      <span className={`size-5 rounded-full bg-white shadow transition-transform ${prefs[o.key] ? "translate-x-5" : ""}`} />
                    </span>
                  </button>
                ))}
                <button onClick={resetPrefs} className="label mt-3 text-[10px] text-glow hover:underline">
                  Reset to defaults
                </button>
              </section>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body)}
    </>
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
  const { alerts: ALERTS } = useSite();
  const [i, setI] = useState(0);
  const closed = useSyncExternalStore(subscribeBar, barClosed, () => false);

  // the bar's height feeds the fixed nav and the hero so nothing sits underneath it
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--bar-h", closed ? "0px" : "36px");
  }, [closed]);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % Math.max(1, ALERTS.length)), 5000);
    return () => clearInterval(id);
  }, [ALERTS.length]);

  const close = () => {
    try {
      sessionStorage.setItem(BAR_KEY, "1");
    } catch {}
    barListeners.forEach((l) => l());
  };

  const a = ALERTS[i % Math.max(1, ALERTS.length)];
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
          <span className="label hidden text-[10px] opacity-70 sm:inline">{a.tone === "deal" ? "🔥 Hot deal" : a.tone === "new" ? "✦ New" : "ⓘ Info"}</span>
          <div className="relative h-9 flex-1 overflow-hidden text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={a.id}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center gap-3 truncate"
              >
                <span className="truncate">{a.text}</span>
                {a.href && (
                  <Link href={a.href} className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80">
                    {a.cta ?? "More"} →
                  </Link>
                )}
              </motion.p>
            </AnimatePresence>
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
  const { promos: PROMOS } = useSite();
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
