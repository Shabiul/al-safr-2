"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { useSite } from "./ContentProvider";
import { RollText, Scramble } from "./ui";

export default function Footer() {
  const { packages } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-big] span", {
        yPercent: 100,
        stagger: 0.05,
        ease: "expo.out",
        duration: 1.4,
        scrollTrigger: { trigger: "[data-big]", start: "top 95%" },
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative overflow-hidden border-t border-ice/10 bg-ink pt-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <p className="label mb-4 text-glow">Al-Safar Holidays</p>
          <p className="max-w-sm font-serif text-3xl italic leading-tight text-ice/90">
            Complete holidays, from first flight to final sunset.
          </p>
        </div>
        <div>
          <p className="label mb-4 text-frost/60">Packages</p>
          <ul className="space-y-2 text-sm text-ice/70">
            {packages.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <Link href={`/packages/${p.slug}`} className="hover:text-ice">
                  <RollText>{`${p.country} — ${p.title}`}</RollText>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label mb-4 text-frost/60">Contact</p>
          <ul className="space-y-2 text-sm text-ice/70">
            <li>hello@alsafr.travel</li>
            <li>+91 80 0000 0000</li>
            <li>Bengaluru, Karnataka, India</li>
          </ul>
        </div>
      </div>

      <div data-big className="mt-20 flex justify-center overflow-hidden px-2 leading-[0.8]" aria-hidden>
        {"AL-SAFAR".split("").map((c, i) => (
          <span key={i} className="text-outline inline-block text-[22vw] font-semibold tracking-tighter">
            {c === " " ? " " : c}
          </span>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-ice/10 px-5 py-6 md:px-10">
        <Scramble className="label text-frost/50">© 2026 Al-Safar Holidays</Scramble>
        <Scramble className="label text-frost/50">N 25°12′ E 55°16′</Scramble>
      </div>
    </footer>
  );
}
