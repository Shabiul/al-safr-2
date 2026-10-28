"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { featured } from "@/data/packages";
import PackageCard from "./PackageCard";
import { Button, Reveal, Scramble } from "./ui";

export default function PackagesRail() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        gsap.to("[data-progress]", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true },
        });
        // each card's photo drifts against the rail, and the card lifts as it reaches centre
        gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
          gsap.fromTo(
            card.querySelector("[data-parallax]"),
            { xPercent: 6 },
            {
              xPercent: -6,
              ease: "none",
              scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
            },
          );
          gsap.fromTo(
            card,
            { y: 60, rotate: 3 },
            {
              y: 0,
              rotate: 0,
              ease: "power2.out",
              scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "center center", scrub: true },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="packages" className="relative overflow-hidden bg-ink py-24 md:flex md:h-screen md:flex-col md:justify-center md:py-0">
      <div className="mx-auto mb-10 flex w-full max-w-7xl items-end justify-between gap-6 px-5 md:px-10">
        <div>
          <Scramble className="label mb-4 block text-glow">[ 02 ] Signature packages</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            Ten journeys, zero loose ends.
          </Reveal>
        </div>
        <div className="hidden md:block">
          <Button href="/packages" variant="ghost">
            View all
          </Button>
        </div>
      </div>

      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 md:w-max md:overflow-visible md:px-10 md:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {featured.map((p, i) => (
          <div key={p.slug} data-card className="w-[82vw] shrink-0 snap-center sm:w-[380px] md:w-[400px]">
            <PackageCard p={p} index={i} />
          </div>
        ))}
        <div className="flex w-[60vw] shrink-0 items-center justify-center md:w-[30vw]">
          <Button href="/packages">See every package</Button>
        </div>
      </div>

      <div className="mx-auto mt-10 hidden w-full max-w-7xl px-10 md:block">
        <div className="h-px w-full bg-ice/10">
          <div data-progress className="h-full origin-left scale-x-0 bg-glow" />
        </div>
      </div>
    </section>
  );
}
