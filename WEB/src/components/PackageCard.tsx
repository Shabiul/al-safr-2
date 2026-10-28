"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { durationLabel, formatDate, type Package } from "@/data/packages";

export default function PackageCard({ p, index, className = "" }: { p: Package; index: number; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  // 3D tilt + moving glare
  useGSAP(() => {
    const el = ref.current!;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * 14);
      rx((0.5 - y) * 14);
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  });

  return (
    <div className={`[perspective:1200px] ${className}`}>
      <Link
        ref={ref}
        href={`/packages/${p.slug}`}
        data-cursor="View"
        className="group relative block aspect-[3/4] overflow-hidden rounded-[28px] border border-ice/10 bg-night [transform-style:preserve-3d]"
      >
        <div data-parallax className="absolute inset-[-8%]">
          <Image
            src={p.image}
            alt={`${p.place}, ${p.country}`}
            fill
            sizes="(max-width: 768px) 85vw, 420px"
            className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink from-10% via-ink/75 via-45% to-transparent to-75%" />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,.55), transparent 45%)" }}
        />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 [transform:translateZ(40px)]">
          <span className="label rounded-full bg-ink/50 px-3 py-1.5 text-ice backdrop-blur">{p.category}</span>
          {p.was ? (
            <span className="label rounded-full bg-sand px-3 py-1.5 text-ink">Save ${(p.was - p.price).toLocaleString("en-US")}</span>
          ) : (
            <span className="label text-ice/70">{String(index + 1).padStart(2, "0")}</span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 [transform:translateZ(60px)]">
          <p className="label mb-2 text-glow">
            {p.country} · {durationLabel(p)}
          </p>
          <h3 className="text-3xl font-semibold leading-none tracking-tight">{p.title}</h3>
          <p className="mt-3 line-clamp-2 text-sm text-ice/65">{p.tagline}</p>
          <p className="mt-3 text-xs text-ice/50">
            {p.tourStyle} · Next departure {formatDate(p.departures[0])}
          </p>
          <div className="mt-5 flex items-end justify-between border-t border-ice/15 pt-4">
            <div>
              <p className="label text-frost/60">From</p>
              <p className="text-2xl font-light">
                {p.was && <span className="mr-2 text-base text-ice/40 line-through">${p.was.toLocaleString("en-US")}</span>}${p.price.toLocaleString("en-US")}
                <span className="text-sm text-ice/50"> /person</span>
              </p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-full border border-ice/30 transition-all duration-500 group-hover:rotate-45 group-hover:border-glow group-hover:bg-glow group-hover:text-ink">
              ↗
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
