"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, SCRAMBLE_CHARS } from "@/lib/gsap";
import { finishIntro } from "@/lib/intro";

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const counter = { v: 0 };
      const num = root.current!.querySelector<HTMLElement>("[data-num]")!;
      const tl = gsap.timeline({
        onComplete: () => {
          setGone(true);
        },
      });

      tl.to("[data-word]", {
        duration: 1.2,
        scrambleText: { text: "{original}", chars: SCRAMBLE_CHARS, speed: 0.6 },
        stagger: 0.15,
      })
        .to(
          counter,
          {
            v: 100,
            duration: 2.2,
            ease: "power2.inOut",
            onUpdate: () => {
              num.textContent = String(Math.round(counter.v)).padStart(3, "0");
            },
          },
          0,
        )
        .to("[data-bar]", { scaleX: 1, duration: 2.2, ease: "power2.inOut" }, 0)
        .to("[data-ring]", { rotate: 360, scale: 1.15, duration: 2.2, ease: "power2.inOut" }, 0)
        .to("[data-inner]", { opacity: 0, y: -30, duration: 0.5, ease: "power2.in" })
        .add(finishIntro, "-=0.1")
        .to("[data-panel]", {
          yPercent: -100,
          duration: 1.1,
          ease: "expo.inOut",
          stagger: { each: 0.06, from: "center" },
        });
    },
    { scope: root },
  );

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100]" aria-label="Loading" role="status">
      <div className="absolute inset-0 flex">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} data-panel className="h-full flex-1 bg-ink border-r border-ice/[0.03]" />
        ))}
      </div>
      <div data-inner className="relative flex h-full flex-col items-center justify-center gap-10">
        <div data-ring className="relative size-28 rounded-full border border-glow/30">
          <div className="absolute inset-3 rotate-45 border border-ice/40" />
          <div className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow shadow-[0_0_20px_#0e8fb3]" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="label text-frost">
            <span data-word>AL&nbsp;SAFR</span> <span className="text-glow">✦</span>{" "}
            <span data-word>HOLIDAY&nbsp;SYSTEMS</span>
          </p>
          <p data-num className="font-mono text-6xl font-light tabular-nums tracking-tight">
            000
          </p>
          <div className="h-px w-56 bg-ice/10">
            <div data-bar className="h-full origin-left scale-x-0 bg-glow" />
          </div>
          <p className="label text-frost/60">
            <span data-word>Packing&nbsp;your&nbsp;bags</span>
          </p>
        </div>
      </div>
    </div>
  );
}
