"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { byCountry } from "@/data/packages";

const packages = byCountry.slice(0, 12);
import { Reveal, Scramble } from "./ui";

const GlobeScene = dynamic(() => import("./three/GlobeScene"), { ssr: false });

export default function GlobeSection() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(packages[0].slug);
  const [live, setLive] = useState(false);
  const current = packages.find((p) => p.slug === active)!;

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: "200px" });
    io.observe(root.current!);
    return () => io.disconnect();
  }, []);

  // auto-cycle destinations while nobody is interacting
  const paused = useRef(false);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (paused.current) return;
      setActive((a) => packages[(packages.findIndex((p) => p.slug === a) + 1) % packages.length].slug);
    }, 3500);
    return () => clearInterval(id);
  }, [live]);

  useGSAP(
    () => {
      gsap.fromTo("[data-detail] > *", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: "expo.out" });
    },
    { scope: root, dependencies: [active] },
  );

  useGSAP(
    () => {
      gsap.from("[data-globe]", {
        scale: 0.6,
        opacity: 0,
        rotate: -20,
        ease: "expo.out",
        duration: 2,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="destinations"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_at_center,#dfeaf5_0%,#f4f7fb_65%)] py-28"
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <Scramble className="label mb-4 block text-glow">[ 04 ] Destinations</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            One desk in Dubai. The whole world on it.
          </Reveal>

          <ul className="mt-10 grid grid-cols-2 gap-x-6 border-t border-ice/10">
            {packages.map((p) => (
              <li key={p.slug}>
                <button
                  onClick={() => setActive(p.slug)}
                  onPointerEnter={() => setActive(p.slug)}
                  className={`flex w-full items-center justify-between border-b border-ice/10 py-3 text-left text-sm transition-colors ${
                    p.slug === active ? "text-sand" : "text-ice/60 hover:text-ice"
                  }`}
                >
                  {p.country}
                  <span className={`size-1.5 rounded-full transition-all ${p.slug === active ? "scale-150 bg-sand" : "bg-ice/20"}`} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div data-globe data-cursor="Drag" className="aspect-square w-full">
            <GlobeScene items={packages} active={active} onSelect={setActive} live={live} />
          </div>
          <div data-detail className="frost-glass absolute bottom-4 left-4 max-w-xs rounded-2xl p-5 md:bottom-10 md:left-0">
            <p className="label text-glow">
              {current.place} · {current.days} days
            </p>
            <p className="mt-2 text-2xl font-semibold">{current.title}</p>
            <p className="mt-1 text-sm text-ice/60">{current.tagline}</p>
            <Link href={`/packages/${current.slug}`} className="label mt-4 inline-block text-sand hover:underline">
              From ${current.price.toLocaleString("en-US")} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
