"use client";

import { motion } from "motion/react";
import type { TravelLink } from "@/data/updates";
import { useSite } from "./ContentProvider";
import { Reveal, Scramble } from "./ui";

const ICON: Record<TravelLink["kind"], React.ReactNode> = {
  flights: <path d="M2 16l20-8-2-2-8 3-5-5-2 1 3 6-4 2-2-1-1 1 3 3z" />,
  hotels: <path d="M3 20V6h8v6h10v8M3 16h18M7 10h.01M14 12V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3" />,
  buses: <path d="M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11M5 11h14M5 17h14v2H5zM8 20v1M16 20v1M8 14h.01M16 14h.01" />,
  cabs: <path d="M5 17h14v-5l-2-5H7l-2 5zM5 12h14M7 17v2M17 17v2M9 4h6" />,
  trains: <path d="M7 3h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 11h14M9 21l1-3M15 21l-1-3M9 15h.01M15 15h.01" />,
  visa: <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h3" />,
  insurance: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  other: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" />,
};

/** links out for travellers who only need one piece of the trip; managed in the CRM (Website content -> Booking links) */
export default function TravelLinks() {
  const links = useSite().travelLinks.filter((l) => l.enabled);
  if (!links.length) return null;
  return (
    <section id="book" className="mx-auto max-w-7xl px-5 py-24 md:px-10">
      <div className="mb-10 max-w-2xl">
        <Scramble className="label mb-4 block text-glow">[ ↗ ] Book it yourself</Scramble>
        <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-6xl">
          Just need one piece of the trip?
        </Reveal>
        <p className="mt-4 text-ice/60">Book flights, stays or transport on your own through our partners — or let us handle the whole journey.</p>
      </div>
      <div className={`grid gap-4 sm:grid-cols-2 ${links.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {links.map((l, i) => (
          <motion.a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.7, delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            data-cursor="Open"
            className="group flex flex-col rounded-[28px] border border-ice/10 bg-night p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,.35)] transition-colors hover:border-glow"
          >
            <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-glow/12 text-glow transition-colors group-hover:bg-glow group-hover:text-ink">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {ICON[l.kind] ?? ICON.other}
              </svg>
            </span>
            <span className="text-2xl font-semibold">{l.label}</span>
            <span className="mt-2 flex-1 text-sm text-ice/60">{l.blurb}</span>
            <span className="label mt-6 flex items-center gap-2 text-glow">
              {l.cta || "Open"} <span className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
            </span>
          </motion.a>
        ))}
      </div>
      <p className="mt-6 text-xs text-ice/40">These links open partner websites in a new tab; bookings made there are with that partner.</p>
    </section>
  );
}
