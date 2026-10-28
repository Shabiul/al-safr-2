"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, SplitText, SCRAMBLE_CHARS } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";
import { formatDate, packages } from "@/data/packages";
import { img } from "@/data/img";
import type { Anchor, Projected } from "./three/TajCloud";

const TajCloud = dynamic(() => import("./three/TajCloud"), { ssr: false });

// hazy sunrise over still water, like the Yamuna behind the Taj
const BACKDROP = img("1514958566123-9ec36678c8c6", 2400);

// points on the Taj Mahal (local coords: front faces +Z) and where their labels sit
const CALLOUTS: { anchor: Anchor; label: string; pos: { left: string; top: string } }[] = [
  { anchor: [0, 5.3, 0], label: "Onion dome — 73 m", pos: { left: "45%", top: "15%" } },
  { anchor: [3.25, 4.3, 3.25], label: "Minaret, one of four", pos: { left: "80%", top: "23%" } },
  { anchor: [0, 1.9, 2.1], label: "Sunrise entry included", pos: { left: "84%", top: "52%" } },
  { anchor: [-3.4, 0.3, 3.4], label: "Golden Triangle · 7 days", pos: { left: "44%", top: "77%" } },
];
const ANCHORS = CALLOUTS.map((c) => c.anchor);

const nextDeparture = [...packages.flatMap((p) => p.departures)].sort()[0];

function Clock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums text-white">{t}</span>;
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const marks = useRef<(SVGGElement | null)[]>([]);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState(true);
  const introDone = useIntroDone();

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(root.current!);
    return () => io.disconnect();
  }, []);

  // called every frame by the 3D scene: join each label to its point on the plane
  const onProject = useCallback((pts: Projected) => {
    pts.forEach((pt, i) => {
      const label = labels.current[i];
      const line = lines.current[i];
      const mark = marks.current[i];
      if (!label || !line || !mark) return;
      const lx = label.offsetLeft + (label.offsetLeft + label.offsetWidth / 2 < pt.x ? label.offsetWidth + 8 : -8);
      const ly = label.offsetTop + label.offsetHeight / 2;
      line.setAttribute("x1", String(lx));
      line.setAttribute("y1", String(ly));
      line.setAttribute("x2", String(pt.x));
      line.setAttribute("y2", String(pt.y));
      mark.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    });
  }, []);

  useGSAP(
    () => {
      if (!introDone) return;
      const split = SplitText.create("[data-title] [data-line]", { type: "chars", mask: "chars" });
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .fromTo("[data-bg]", { scale: 1.25, opacity: 0 }, { scale: 1.08, opacity: 1, duration: 2.6 })
        .from(split.chars, { yPercent: 115, duration: 1.2, stagger: 0.025 }, 0.3)
        .to("[data-scramble]", { duration: 1.4, scrambleText: { text: "{original}", chars: SCRAMBLE_CHARS, speed: 0.6 }, stagger: 0.08 }, 0.3)
        .from("[data-fade]", { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.9)
        .fromTo("[data-callout]", { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.18 }, 2.4)
        .fromTo("[data-leader]", { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.18 }, 2.5);

      gsap.to("[data-bg]", { yPercent: 12, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to("[data-content]", { yPercent: -25, opacity: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: true } });
      gsap.to("[data-callouts]", { opacity: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "35% top", scrub: true } });
      return () => split.revert();
    },
    { scope: root, dependencies: [introDone] },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[720px] overflow-hidden bg-[#5d646c] text-white">
      <div data-bg className="absolute inset-0 opacity-0">
        <Image src={BACKDROP} alt="" fill priority sizes="100vw" className="object-cover grayscale contrast-110 brightness-[.62]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/5 to-black/25" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent" />

      <div className="absolute inset-0">
        <TajCloud started={introDone} active={visible} anchors={ANCHORS} onProject={onProject} />
      </div>

      {/* leader lines + crosshairs, positioned every frame from the 3D scene */}
      <div data-callouts className="pointer-events-none absolute inset-0">
      <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" aria-hidden>
        {CALLOUTS.map((c, i) => (
          <g key={c.label} data-leader style={{ opacity: 0 }}>
            <line ref={(el) => void (lines.current[i] = el)} stroke="rgba(255,255,255,.75)" strokeWidth="1" />
            <g ref={(el) => void (marks.current[i] = el)}>
              <path d="M-7 0H7M0 -7V7" stroke="#fff" strokeWidth="1.2" />
            </g>
          </g>
        ))}
      </svg>
      {CALLOUTS.map((c, i) => (
        <div
          key={c.label}
          ref={(el) => void (labels.current[i] = el)}
          data-callout
          className="label pointer-events-none absolute hidden items-center gap-2.5 text-[11px] font-semibold tracking-[0.06em] text-white normal-case md:flex"
          style={{ ...c.pos, opacity: 0 }}
        >
          <span className="bg-white/90 px-1.5 py-0.5 text-[#1d242c]">{String(i + 1).padStart(2, "0")}</span>
          {c.label}
        </div>
      ))}
      </div>

      <div data-content className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1500px] flex-col justify-between px-5 pb-10 pt-8 md:px-11">
        <div className="flex items-start justify-between gap-6">
          <div>
            <Link href="/" className="pointer-events-auto block font-wide text-3xl font-extrabold tracking-tight md:text-4xl">
              AL SAFR
            </Link>
            <p className="label mt-4 text-[11px] font-semibold normal-case leading-relaxed tracking-[0.04em] text-white/85">
              <span data-scramble>{"// Copyright © 2026"}</span>
              <br />
              Al Safr Holidays, Dubai.
              <br />
              All journeys handled.
            </p>
          </div>
          <div className="hidden max-w-[19rem] text-right md:block">
            <p data-scramble className="label text-[11px] font-semibold normal-case tracking-[0.04em]">
              {"////// Manifesto"}
            </p>
            <p data-fade className="label mt-3 text-[11px] font-semibold normal-case leading-relaxed tracking-[0.04em] text-white/85">
              Our mission is to make every holiday complete — flights, stays, guides and transfers planned, booked and looked after from
              one desk.
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <p data-scramble className="label mb-6 text-[11px] normal-case tracking-[0.06em] text-white/70">
            {"////// Tours & holiday packages — Est. 2026"}
          </p>
          <h1 data-title className="font-wide text-[13vw] font-extrabold uppercase leading-[0.9] tracking-[-0.03em] md:text-[5.6vw]">
            <span data-line className="block">Journeys</span>
            <span data-line className="block">worth</span>
            <span data-line className="block text-[#9fd3ff]">taking.</span>
          </h1>
          <p data-fade className="mt-7 max-w-md text-base leading-relaxed text-white/85 md:text-lg">
            {packages.length} complete tours across {new Set(packages.map((p) => p.country)).size} countries — every trip leaves with its flights, stays, guides
            and transfers booked, and someone on call until you&apos;re home.
          </p>
          <div data-fade className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <Link href="/packages" className="label group flex items-center gap-3 bg-white px-6 py-4 text-[12px] font-semibold text-[#1d242c] transition-colors hover:bg-[#9fd3ff]">
              Find a tour <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/#destinations" className="label border border-white/70 px-6 py-4 text-[12px] font-semibold transition-colors hover:bg-white hover:text-[#1d242c]">
              See destinations
            </Link>
          </div>
        </div>

        <div className="flex items-end justify-between gap-6">
          <p data-fade className="label border-b border-white/40 pb-3 text-[11px] font-semibold normal-case leading-relaxed tracking-[0.04em]">
            Scroll down to
            <br />
            discover.
          </p>
          <div data-fade className="hidden text-right md:block">
            <p className="label text-[11px] normal-case tracking-[0.04em] text-white/70">25.2048°N 55.2708°E</p>
            <p className="label mt-1 text-[11px] normal-case tracking-[0.04em] text-white/70">
              Dubai desk · <Clock /> GST · next departure {formatDate(nextDeparture)}
            </p>
            <Link
              href="/packages"
              className="label pointer-events-auto mt-4 inline-block bg-white px-6 py-3.5 text-[12px] font-semibold text-[#1d242c] transition-colors hover:bg-[#9fd3ff]"
            >
              Reserve a tour
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
