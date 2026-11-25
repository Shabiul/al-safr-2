"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { nightsOf } from "@/data/packages";
import { useSite } from "./ContentProvider";
import { Reveal, Scramble } from "./ui";

const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// column widths in characters
const COLS = [
  { key: "date", label: "Date", width: 6 },
  { key: "dest", label: "Destination", width: 12 },
  { key: "tour", label: "Tour", width: 18, wide: true },
  { key: "code", label: "Code", width: 6 },
  { key: "nights", label: "Nts", width: 3 },
  { key: "status", label: "Status", width: 13 },
] as const;

type Row = Record<(typeof COLS)[number]["key"], string> & { slug: string; iso: string };

const pad = (s: string, n: number) => s.toUpperCase().slice(0, n).padEnd(n, " ");
/** "Malé Atoll" → "Male Atoll": the board only has plain letters */
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "");

/** Airport split-flap board of real upcoming departures; every cell clatters through letters before settling. */
export function DepartureBoard() {
  const { packages } = useSite();
  const root = useRef<HTMLElement>(null);
  const flips = useRef<gsap.core.Timeline[]>([]);
  const [clock, setClock] = useState("--:--");
  const all = useMemo<Row[]>(
    () =>
      packages
        .flatMap((p, i) =>
          p.departures.map((iso) => {
            const [, m, d] = iso.split("-").map(Number);
            return {
              slug: p.slug,
              iso,
              date: `${String(d).padStart(2, "0")} ${MONTHS[m - 1]}`,
              dest: plain(/villa/i.test(p.route[0].place) ? p.country : p.route[0].place),
              tour: plain(p.title),
              code: `AS${String(i + 101)}`,
              nights: String(nightsOf(p)),
              status: "",
            };
          }),
        )
        .sort((a, b) => a.iso.localeCompare(b.iso)),
    [packages],
  );
  const ROWS = 8;
  const [page, setPage] = useState(0);
  const rows = all.slice(page * ROWS, page * ROWS + ROWS);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  // flip every cell to its row's text
  useGSAP(
    () => {
      const run = () => {
        // a new page must not race the previous page's flips
        flips.current.forEach((t) => t.kill());
        flips.current = [];
        const today = Date.now();
        root.current!.querySelectorAll<HTMLElement>("[data-row]").forEach((rowEl, r) => {
          const row = rows[r];
          const days = row ? (new Date(row.iso).getTime() - today) / 864e5 : 0;
          const status = !row ? "" : days <= 21 ? "BOARDING SOON" : days <= 60 ? "BOOKING OPEN" : "ON SCHEDULE";
          rowEl.dataset.state = status.startsWith("BOARDING") ? "soon" : "ok";
          COLS.forEach((c) => {
            const text = pad(row ? (c.key === "status" ? status : row[c.key]) : "", c.width);
            rowEl.querySelectorAll<HTMLElement>(`[data-col="${c.key}"] [data-flap]`).forEach((cell, k) => {
              const target = text[k];
              if (cell.textContent === target) return;
              const spins = 4 + Math.floor(Math.random() * 8);
              const tl = gsap.timeline({ delay: r * 0.06 + k * 0.025 });
              flips.current.push(tl);
              for (let s = 0; s < spins; s++)
                tl.call(() => void (cell.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)])).fromTo(
                  cell,
                  { rotationX: -70 },
                  { rotationX: 0, duration: 0.05, ease: "none" },
                );
              tl.call(() => void (cell.textContent = target));
            });
          });
        });
      };
      const st = ScrollTrigger.create({ trigger: root.current, start: "top 75%", once: true, onEnter: run });
      if (st.progress > 0 || st.isActive) run();
    },
    { scope: root, dependencies: [page] },
  );

  // cycle through the next pages of departures while it is on screen
  useEffect(() => {
    const id = setInterval(() => setPage((p) => (p + 1) % Math.ceil(all.length / ROWS)), 9000);
    return () => clearInterval(id);
  }, [all.length]);

  return (
    <section ref={root} id="departures" className="mx-auto max-w-7xl px-5 py-24 md:px-10">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Scramble className="label mb-4 block text-glow">[ ✈ ] Live departures</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            The board is always moving.
          </Reveal>
        </div>
        <p className="max-w-sm text-ice/60">Every upcoming group departure across all {packages.length} tours, refreshed as the dates come round.</p>
      </div>

      <div className="overflow-x-auto rounded-[28px] bg-[#0d1622] p-5 text-[#f5c46b] shadow-[0_30px_80px_-30px_rgba(11,26,43,.6)] md:p-8" data-lenis-prevent>
        <div className="mb-5 flex items-center justify-between font-mono text-xs tracking-[0.25em] text-white/60">
          <span>✈ DEPARTURES · AL-SAFAR BLR</span>
          <span className="tabular-nums">{clock} IST</span>
        </div>
        <div className="min-w-[560px] font-mono" style={{ perspective: 400 }}>
          <div className="mb-2 flex gap-4 text-[10px] tracking-[0.25em] text-white/40">
            {COLS.map((c) => (
              <span key={c.key} className={"wide" in c ? "hidden md:block" : ""} style={{ width: `${c.width * 1.17}rem` }}>
                {c.label.toUpperCase()}
              </span>
            ))}
          </div>
          {Array.from({ length: ROWS }, (_, r) => (
            <Link
              key={r}
              data-row
              href={rows[r] ? `/packages/${rows[r].slug}` : "/packages"}
              className="group flex gap-4 border-t border-white/5 py-1.5 transition-colors hover:bg-white/5 data-[state=soon]:[&_[data-col=status]]:text-[#ff9b6b]"
            >
              {COLS.map((c) => (
                <span key={c.key} data-col={c.key} className={`flex gap-[2px] ${"wide" in c ? "hidden md:flex" : ""}`} style={{ width: `${c.width * 1.17}rem` }}>
                  {Array.from({ length: c.width }, (_, k) => (
                    <span
                      key={k}
                      data-flap
                      className="relative flex h-7 w-[1.05rem] items-center justify-center rounded-[3px] bg-[#16212f] text-sm font-semibold leading-none [transform-style:preserve-3d] after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-black/50"
                    >
                      {" "}
                    </span>
                  ))}
                </span>
              ))}
            </Link>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between font-mono text-[10px] tracking-[0.25em] text-white/40">
          <span>
            PAGE {page + 1}/{Math.ceil(all.length / ROWS)}
          </span>
          <span>{all.length} SCHEDULED DEPARTURES</span>
        </div>
      </div>
    </section>
  );
}

/** Four columns of trip photos sliding past each other on scroll, with a pinned statement in the middle. */
export function PhotoWall() {
  const { packages } = useSite();
  const root = useRef<HTMLElement>(null);
  const columns = useMemo(() => {
    const imgs = packages.map((p) => ({ src: p.image, alt: `${p.place}, ${p.country}`, slug: p.slug }));
    return [0, 1, 2, 3].map((c) => [...imgs.filter((_, i) => i % 4 === c), ...imgs.filter((_, i) => i % 4 === c)].slice(0, 7));
  }, [packages]);
  const countries = new Set(packages.map((p) => p.country)).size;

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-col-wall]").forEach((col, i) => {
        gsap.fromTo(
          col,
          { yPercent: i % 2 ? -30 : 0 },
          { yPercent: i % 2 ? 0 : -30, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } },
        );
      });
      gsap.from("[data-wall-text] > *", { y: 60, opacity: 0, stagger: 0.12, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 60%" } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="collection" className="relative h-[130vh] overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-2 gap-3 px-3 md:grid-cols-4 md:gap-4 md:px-4 [mask-image:linear-gradient(transparent,#000_15%,#000_85%,transparent)]">
        {columns.map((col, i) => (
          <div key={i} data-col-wall className={`flex flex-col gap-3 md:gap-4 ${i > 1 ? "hidden md:flex" : ""}`}>
            {col.map((im, k) => (
              <Link key={k} href={`/packages/${im.slug}`} className="group relative aspect-[3/4] shrink-0 overflow-hidden rounded-3xl">
                <Image src={im.src} alt={im.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--ink)_92%,transparent)_0%,color-mix(in_srgb,var(--ink)_60%,transparent)_35%,transparent_70%)]" />
      <div data-wall-text className="pointer-events-none sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
        <p className="label mb-6 text-glow">[ ◎ ] The collection</p>
        <p className="font-wide text-6xl font-extrabold uppercase leading-[0.9] tracking-[-0.03em] md:text-8xl">
          {packages.length} journeys.
          <br />
          <span className="text-glow">{countries} countries.</span>
          <br />
          One desk.
        </p>
        <Link href="/packages" className="label pointer-events-auto mt-10 rounded-full bg-ice px-7 py-4 text-ink transition-colors hover:bg-glow">
          Browse every tour →
        </Link>
      </div>
    </section>
  );
}
