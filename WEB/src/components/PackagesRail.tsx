"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useSite } from "./ContentProvider";
import PackageCard from "./PackageCard";
import { Button, Reveal, Scramble } from "./ui";

// Featured packages as a normal top-to-bottom grid, filterable by style
export default function PackagesRail() {
  const { featured } = useSite();
  const tabs = ["All", ...new Set(featured.map((p) => p.category))];
  const root = useRef<HTMLElement>(null);
  const [tab, setTab] = useState("All");
  const list = featured.filter((p) => tab === "All" || p.category === tab);

  useGSAP(
    () => {
      gsap.from("[data-tabs] > *", { y: 20, opacity: 0, stagger: 0.05, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 75%" } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="packages" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Scramble className="label mb-4 block text-glow">[ 02 ] Featured packages</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            Ten journeys, zero loose ends.
          </Reveal>
        </div>
        <Button href="/packages" variant="ghost">
          View all tours
        </Button>
      </div>

      <div data-tabs className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`label relative rounded-full px-4 py-2.5 transition-colors ${tab === t ? "text-ink" : "border border-ice/15 text-ice/70 hover:text-ice"}`}
          >
            {tab === t && <motion.span layoutId="featured-tab" className="absolute inset-0 rounded-full bg-glow" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 60, rotate: i % 2 ? 2 : -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
              transition={{ type: "spring", bounce: 0.18, duration: 0.8, delay: (i % 3) * 0.08 }}
            >
              <PackageCard p={p} index={featured.indexOf(p)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
