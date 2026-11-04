"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useSite } from "./ContentProvider";
import { Reveal, Scramble } from "./ui";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { d: String(d).padStart(2, "0"), m: MON[m - 1], y, label: `${d} ${MON[m - 1]} ${y}` };
};

export default function NewsEvents() {
  const { events: EVENTS, news: NEWS } = useSite();
  const [tab, setTab] = useState<"events" | "news">("events");
  const items =
    tab === "events"
      ? EVENTS.map((e) => ({ key: e.title, title: e.title, body: e.body, image: e.image, href: e.href, top: e.place, when: e.end ? `${day(e.start).label} – ${day(e.end).label}` : day(e.start).label, badge: day(e.start) }))
      : NEWS.map((n) => ({ key: n.title, title: n.title, body: n.body, image: n.image, href: n.href, top: n.tag, when: day(n.date).label, badge: day(n.date) }));

  return (
    <section id="news" className="mx-auto max-w-7xl px-5 py-28 md:px-10">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Scramble className="label mb-4 block text-glow">[ ◷ ] News & events</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            What&apos;s happening out there.
          </Reveal>
        </div>
        <div className="flex gap-2">
          {(["events", "news"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`label relative rounded-full px-5 py-3 transition-colors ${tab === t ? "text-ink" : "border border-ice/15 text-ice/70 hover:text-ice"}`}>
              {tab === t && <motion.span layoutId="news-tab" className="absolute inset-0 rounded-full bg-glow" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
              <span className="relative">{t === "events" ? "Upcoming events" : "Latest news"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${tab === "events" ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
        <AnimatePresence mode="popLayout">
          {items.map((it, i) => (
            <motion.article
              key={tab + it.key}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.18, duration: 0.7, delay: i * 0.07 }}
              whileHover={{ y: -6 }}
            >
              <Link href={it.href} className="group block overflow-hidden rounded-[28px] border border-ice/10 bg-night shadow-[0_20px_50px_-30px_rgba(0,0,0,.4)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={it.image} alt="" fill sizes="(max-width: 768px) 100vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute left-4 top-4 flex flex-col items-center rounded-2xl bg-night/90 px-3 py-2 text-center shadow backdrop-blur">
                    <span className="text-2xl font-semibold leading-none">{it.badge.d}</span>
                    <span className="label text-[9px] text-glow">{it.badge.m}</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="label text-[10px] text-frost/70">{it.top}</p>
                  <h3 className="mt-2 text-xl font-semibold leading-tight">{it.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ice/60">{it.body}</p>
                  <p className="mt-4 flex items-center justify-between text-xs text-ice/50">
                    {it.when}
                    <span className="text-glow transition-transform duration-500 group-hover:translate-x-1">→</span>
                  </p>
                </div>
              </Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
