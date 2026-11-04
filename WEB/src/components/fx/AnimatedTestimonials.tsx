"use client";

// Adapted from "Animated Testimonials" by bankkroll on 21st.dev (https://21st.dev/r/bankkroll/animated-testimonials):
// restyled for Al Safr, framer-motion → motion, avatars swapped for initials, progress bar on the active dot, links to the tour.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { Reveal, Scramble } from "../ui";

export type Review = { name: string; where: string; trip: string; slug: string; quote: string; rating: number };

export default function AnimatedTestimonials({ reviews, interval = 6000 }: { reviews: Review[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { once: true, amount: 0.25 });

  useEffect(() => {
    if (paused || reviews.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % reviews.length), interval);
    return () => clearInterval(id);
  }, [paused, reviews.length, interval, active]);

  return (
    <section ref={root} id="reviews" className="mx-auto max-w-7xl overflow-hidden px-5 py-28 md:px-10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
        className="grid items-center gap-16 md:grid-cols-2 lg:gap-24"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}>
          <Scramble className="label mb-4 block text-glow">[ 07 ] Postcards</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            Sent back to us.
          </Reveal>
          <p className="mt-6 max-w-md text-ice/60">Notes from travellers who came home with every connection made and nothing left to chance.</p>
          <div className="mt-10 flex items-center gap-3">
            {reviews.map((r, i) => (
              <button
                key={r.name}
                onClick={() => setActive(i)}
                aria-label={`Show review from ${r.name}`}
                className={`relative h-2.5 overflow-hidden rounded-full transition-all duration-500 ${active === i ? "w-14 bg-ice/15" : "w-2.5 bg-ice/25 hover:bg-ice/40"}`}
              >
                {active === i && (
                  <motion.span
                    key={`${active}-${paused}`}
                    className="absolute inset-y-0 left-0 bg-glow"
                    initial={{ width: "0%" }}
                    animate={{ width: paused ? "0%" : "100%" }}
                    transition={{ duration: paused ? 0 : interval / 1000, ease: "linear" }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8 } } }} className="relative min-h-[360px] md:mr-10">
          <div className="absolute -bottom-6 -left-6 size-28 rounded-3xl bg-glow/10" />
          <div className="absolute -right-6 -top-6 size-28 rounded-3xl bg-sand/15" />
          {reviews.map((r, i) => (
            <motion.figure
              key={r.name}
              className="absolute inset-0 flex flex-col rounded-3xl border border-ice/10 bg-night p-8 shadow-[0_30px_60px_-30px_rgba(11,26,43,.45)]"
              initial={false}
              animate={{ opacity: active === i ? 1 : 0, x: active === i ? 0 : 90, scale: active === i ? 1 : 0.92, rotate: active === i ? 0 : 2 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: active === i ? 10 : 0, pointerEvents: active === i ? "auto" : "none" }}
              aria-hidden={active !== i}
            >
              <p className="text-lg tracking-[0.2em] text-sand">{"★".repeat(r.rating)}</p>
              <span aria-hidden className="mt-2 font-serif text-7xl leading-none text-glow/25">“</span>
              <blockquote className="-mt-6 flex-1 font-serif text-2xl italic leading-snug md:text-3xl">{r.quote}</blockquote>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-ice/10 pt-5">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-full bg-glow/15 font-semibold text-glow">{r.name.charAt(0)}</span>
                  <figcaption>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-ice/55">{r.where}</p>
                  </figcaption>
                </div>
                <Link href={`/packages/${r.slug}`} className="label text-glow hover:underline">
                  {r.trip} →
                </Link>
              </div>
            </motion.figure>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
