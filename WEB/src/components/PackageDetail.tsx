"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { useIntroDone } from "@/lib/intro";
import {
  IMPORTANT_NOTES,
  STANDARD_INCLUSIONS,
  TERMS,
  activitiesOf,
  durationLabel,
  exclusionsOf,
  formatDate,
  nightsOf,
  offPercent,
  routeLabel,
  stopForDay,
  type Package,
} from "@/data/packages";
import dynamic from "next/dynamic";
import { scrollToEl } from "./SmoothScroll";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false, loading: () => <div className="h-[380px] animate-pulse rounded-2xl bg-ice/5 md:h-[460px]" /> });
import { Magnetic, RollText, Scramble } from "./ui";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const SECTIONS = [
  ["overview", "Overview"],
  ["inclusions", "Inclusions"],
  ["plan", "Day-wise plan"],
  ["info", "Important information"],
  ["terms", "Terms & conditions"],
] as const;

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) scrollToEl(el, -150);
};

const dayKind = (p: Package, i: number) => (i === 0 ? "Arrival" : i === p.itinerary.length - 1 && p.itinerary.length > 1 ? "Departure" : "Sightseeing");

export default function PackageDetail({ p, next }: { p: Package; next: Package }) {
  const root = useRef<HTMLElement>(null);
  const introDone = useIntroDone();
  const photos = [p.image, ...p.gallery];
  const [lightbox, setLightbox] = useState(false);
  const [active, setActive] = useState<string>("overview");

  useGSAP(
    () => {
      if (!introDone) return;
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .fromTo("[data-tile]", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, stagger: 0.08 })
        .from("[data-head] > *", { y: 30, opacity: 0, stagger: 0.07, duration: 1 }, 0.4);
      gsap.utils.toArray<HTMLElement>("[data-card]").forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-moment]").forEach((el) => {
        gsap.from(el, { x: 40, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
    },
    { scope: root, dependencies: [introDone, p.slug] },
  );

  // highlight the tab of the section in view
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [p.slug]);

  return (
    <main ref={root} className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-10">
      <Link href="/packages" className="label mb-6 inline-block text-ice/60 hover:text-glow">
        ← <RollText>All packages</RollText>
      </Link>

      <Gallery photos={photos} title={p.title} onOpen={() => setLightbox(true)} />

      <div data-head className="mt-8">
        <Scramble className="label block text-glow">{`${p.place} — ${p.country}`}</Scramble>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">{p.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-md border border-glow/40 px-2.5 py-1 text-glow">{durationLabel(p)}</span>
          <span className="rounded-md bg-glow/10 px-2.5 py-1 text-glow">{p.tourStyle}</span>
          <span className="rounded-md bg-ice/5 px-2.5 py-1">★ {p.rating.toFixed(1)}</span>
          <span className="text-ice/60">{routeLabel(p)}</span>
        </div>
      </div>

      {/* section tabs */}
      <nav className="sticky top-24 z-30 -mx-5 mt-8 overflow-x-auto border-b border-ice/10 bg-ink/85 px-5 backdrop-blur md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden" data-lenis-prevent>
        <ul className="flex gap-6">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <button
                onClick={() => scrollToId(id)}
                className={`relative whitespace-nowrap py-4 text-sm transition-colors ${active === id ? "text-glow" : "text-ice/60 hover:text-ice"}`}
              >
                {label}
                <span className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-glow transition-transform duration-500 ${active === id ? "scale-x-100" : "scale-x-0"}`} />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <section id="overview" className="space-y-8">
            <Card title="Overview">
              <p className="leading-relaxed text-ice/80">{p.description}</p>
              <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ice/10 bg-ice/10 md:grid-cols-3">
                {[
                  ["Duration", durationLabel(p)],
                  ["Tour type", p.tourStyle],
                  ["Group size", p.groupSize],
                  ["Best time", p.bestTime],
                  ["Hotels", `${p.stars}★`],
                  ["Meal plan", p.mealPlan],
                ].map(([k, v]) => (
                  <div key={k} className="bg-night p-4">
                    <dt className="label text-[10px] text-frost/60">{k}</dt>
                    <dd className="mt-1.5">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="label mb-3 mt-6 text-[10px] text-frost/60">Upcoming departures</p>
              <ul className="flex flex-wrap gap-2">
                {p.departures.map((d) => (
                  <li key={d} className="rounded-full border border-ice/15 px-3.5 py-1.5 text-sm">
                    {formatDate(d)}
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Trip route">
              <RouteMap p={p} />
            </Card>

            <Card title="Trip highlights">
              <ol className="relative space-y-6 border-l-2 border-glow/30 pl-8">
                {p.itinerary.map((d, i) => (
                  <li key={i} data-moment className="relative">
                    <span className="absolute -left-[45px] top-0 flex size-8 items-center justify-center rounded-full bg-glow text-sm font-semibold text-ink">{i + 1}</span>
                    <p className="label text-[10px] text-frost/60">
                      Day {i + 1} · {stopForDay(p, i).place}
                    </p>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-ice/10">
                      <div className="relative aspect-[21/8]">
                        <Image src={photos[i % photos.length]} alt={d.title} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
                      </div>
                      <p className="bg-night px-4 py-3 text-sm">
                        <span className="font-semibold">{d.title}.</span> <span className="text-ice/70">{d.desc}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm text-ice/50">
                {p.itinerary.length} {p.itinerary.length === 1 ? "moment" : "moments"} across this trip
              </p>
            </Card>

            <Card title="Package details">
              <DetailsTabs p={p} />
            </Card>

            <Card title="Hotels">
              <div className="overflow-x-auto" data-lenis-prevent>
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="label text-[10px] text-frost/60">
                    <tr className="border-b border-ice/10">
                      {["Stay", "Destination", "Meal plan", "Nights", "Check-in", "Check-out"].map((h) => (
                        <th key={h} className="py-3 pr-4 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.route
                      .filter((s) => s.nights > 0)
                      .map((s, i) => (
                        <tr key={i} className="border-b border-ice/5 last:border-0">
                          <td className="py-3 pr-4">
                            {s.stay} <span className="text-sand">{"★".repeat(p.stars)}</span>
                          </td>
                          <td className="py-3 pr-4 text-ice/70">{s.place}</td>
                          <td className="py-3 pr-4 text-ice/70">{p.mealPlan}</td>
                          <td className="py-3 pr-4 text-ice/70">
                            {s.nights} {s.nights === 1 ? "Night" : "Nights"}
                          </td>
                          <td className="py-3 pr-4 text-ice/70">2:00 PM</td>
                          <td className="py-3 text-ice/70">11:00 AM</td>
                        </tr>
                      ))}
                    {nightsOf(p) === 0 && (
                      <tr>
                        <td colSpan={6} className="py-3 text-ice/60">
                          Day trip — no overnight stay.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section id="inclusions" className="grid gap-8 md:grid-cols-2">
            <Card title="Inclusions">
              <ul className="space-y-2.5 text-sm">
                {[...(p.flights ? ["Return flights"] : []), ...p.inclusions, ...STANDARD_INCLUSIONS].map((it) => (
                  <li key={it} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-glow/15 text-xs text-glow">✓</span>
                    {it}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Exclusions">
              <ul className="space-y-2.5 text-sm">
                {exclusionsOf(p).map((it) => (
                  <li key={it} className="flex gap-3 text-ice/80">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e5484d]/15 text-xs text-[#d1343a]">✕</span>
                    {it}
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section id="plan">
            <h2 className="mb-5 text-3xl font-semibold tracking-tight">Day-wise planner</h2>
            <div className="space-y-3">
              {p.itinerary.map((d, i) => (
                <DayRow key={i} p={p} i={i} />
              ))}
            </div>
          </section>

          <section id="info">
            <Card title="Important notes">
              <ul className="list-disc space-y-2 pl-5 text-sm text-ice/75 marker:text-glow">
                {IMPORTANT_NOTES.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Card>
          </section>

          <section id="terms">
            <Card title="Terms & conditions">
              <div className="divide-y divide-ice/10">
                {TERMS.map(([t, body]) => (
                  <details key={t} className="group/t py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                      {t}
                      <span className="text-ice/50 transition-transform group-open/t:rotate-180">⌄</span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-ice/65">{body}</p>
                  </details>
                ))}
              </div>
            </Card>
          </section>
        </div>

        <aside id="enquire" className="scroll-mt-40 lg:sticky lg:top-44 lg:self-start">
          <Enquiry p={p} />
        </aside>
      </div>

      <Link href={`/packages/${next.slug}`} data-cursor="Next" className="group relative mt-20 block overflow-hidden rounded-[32px] border border-ice/10 py-20 text-center">
        <Image src={next.image} alt="" fill sizes="100vw" className="scale-110 object-cover opacity-25 transition-all duration-1000 group-hover:scale-100 group-hover:opacity-45" />
        <p className="label relative text-frost/60">Next journey</p>
        <p className="relative mt-4 text-5xl font-semibold tracking-tight transition-transform duration-700 group-hover:scale-105 md:text-7xl">{next.title} →</p>
        <p className="label relative mt-4 text-glow">
          {next.country} · {durationLabel(next)}
        </p>
      </Link>

      {lightbox && <Lightbox photos={photos} title={p.title} onClose={() => setLightbox(false)} />}
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div data-card className="rounded-3xl border border-ice/10 bg-night/70 p-6 md:p-7">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

/** big photo + up to three thumbs, roammyway-style mosaic */
function Gallery({ photos, title, onOpen }: { photos: string[]; title: string; onOpen: () => void }) {
  const thumbs = photos.slice(1, 4);
  const layout = thumbs.length === 3 ? "grid-cols-2 grid-rows-2" : thumbs.length === 2 ? "grid-rows-2" : "grid-rows-1";
  return (
    <div className="relative grid h-[300px] gap-2 overflow-hidden rounded-[28px] md:h-[440px] md:grid-cols-[1.6fr_1fr]">
      <button data-tile onClick={onOpen} className="group relative overflow-hidden" aria-label="Show all photos">
        <Image src={photos[0]} alt={title} fill priority sizes="(max-width: 768px) 100vw, 60vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
      </button>
      {thumbs.length > 0 && (
        <div className={`hidden gap-2 md:grid ${layout}`}>
          {thumbs.map((src, i) => (
            <button
              key={src + i}
              data-tile
              onClick={onOpen}
              className={`group relative overflow-hidden ${thumbs.length === 3 && i === 0 ? "col-span-2" : ""}`}
              aria-label="Show all photos"
            >
              <Image src={src} alt="" fill sizes="30vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
            </button>
          ))}
        </div>
      )}
      <button onClick={onOpen} className="label absolute bottom-4 right-4 rounded-full bg-ink/70 px-4 py-2 text-ice backdrop-blur hover:bg-glow hover:text-ink">
        Show all photos · {photos.length}
      </button>
    </div>
  );
}

function Lightbox({ photos, title, onClose }: { photos: string[]; title: string; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal aria-label={`${title} photos`} className="fixed inset-0 z-[95] overflow-y-auto bg-ink/95 p-5 backdrop-blur md:p-10" data-lenis-prevent>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xl font-semibold">{title}</p>
          <button onClick={onClose} autoFocus className="label rounded-full border border-ice/20 px-4 py-2 hover:border-glow hover:text-glow">
            Close ✕
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((src, i) => (
            <div key={src + i} className={`relative overflow-hidden rounded-2xl ${i === 0 ? "aspect-[16/9] sm:col-span-2" : "aspect-[4/3]"}`}>
              <Image src={src} alt={`${title} photo ${i + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailsTabs({ p }: { p: Package }) {
  const [tab, setTab] = useState<"Summary" | "Stay" | "Activities">("Summary");
  const groups = p.route.map((s) => ({ stop: s, days: [] as number[] }));
  p.itinerary.forEach((_, i) => {
    const s = stopForDay(p, i);
    groups.find((g) => g.stop === s)?.days.push(i);
  });
  return (
    <div>
      <div className="mb-5 flex gap-2">
        {(["Summary", "Stay", "Activities"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm transition-colors ${tab === t ? "bg-glow text-ink" : "border border-ice/15 text-ice/70 hover:text-ice"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "Summary" && (
        <div className="space-y-5">
          {groups
            .filter((g) => g.days.length)
            .map((g, gi) => (
              <div key={gi}>
                <p className="font-semibold">
                  {g.stop.place}{" "}
                  <span className="text-sm font-normal text-ice/50">· {g.stop.nights > 0 ? `${g.stop.nights} ${g.stop.nights === 1 ? "Night" : "Nights"} stay` : "Day visit"}</span>
                </p>
                <ul className="mt-2 space-y-2 border-l border-ice/10 pl-4">
                  {g.days.map((i) => (
                    <li key={i} className="text-sm">
                      <span className="label mr-2 text-[10px] text-glow">Day {i + 1}</span>
                      <span className="text-ice/50">{dayKind(p, i).toLowerCase()}:</span> <span className="text-ice/80">{p.itinerary[i].desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
      {tab === "Stay" && (
        <ul className="space-y-3">
          {p.route.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-ice/10 p-4">
              <div>
                <p className="font-medium">{s.stay}</p>
                <p className="text-sm text-ice/55">{s.place}</p>
              </div>
              <p className="text-right text-sm text-ice/70">
                {s.nights > 0 ? `${s.nights} ${s.nights === 1 ? "Night" : "Nights"}` : "No overnight"}
                <br />
                <span className="text-xs text-ice/45">{p.mealPlan}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
      {tab === "Activities" && (
        <ol className="grid gap-3 sm:grid-cols-2">
          {p.highlights.map((h, i) => (
            <li key={h} className="flex items-center gap-3 rounded-2xl border border-ice/10 p-4 text-sm">
              <span className="label text-glow">{String(i + 1).padStart(2, "0")}</span>
              {h}
            </li>
          ))}
          <li className="text-sm text-ice/50 sm:col-span-2">
            {activitiesOf(p)} guided {activitiesOf(p) === 1 ? "activity" : "activities"} across the trip
          </li>
        </ol>
      )}
    </div>
  );
}

function DayRow({ p, i }: { p: Package; i: number }) {
  const [open, setOpen] = useState(i === 0);
  const d = p.itinerary[i];
  const stop = stopForDay(p, i);
  const last = i === p.itinerary.length - 1 && p.itinerary.length > 1;
  return (
    <div data-card className="rounded-2xl border border-ice/10 bg-night/70">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 p-5 text-left">
        <div>
          <p className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-glow px-2 py-0.5 text-xs font-semibold text-ink">Day {i + 1}</span>
            <span className="font-semibold">{d.title}</span>
          </p>
          <p className="mt-2 text-xs text-ice/50">
            ⌖ {stop.place}
            {!last && stop.nights > 0 && <> · ⌂ {stop.stay}</>}
          </p>
        </div>
        <span className={`mt-1 text-ice/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-500 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="grid gap-3 border-t border-ice/10 p-5 text-sm sm:grid-cols-3">
            <p className="text-ice/80 sm:col-span-3">{d.desc}</p>
            <p>
              <span className="label block text-[10px] text-frost/50">Type</span>
              {dayKind(p, i)}
            </p>
            <p>
              <span className="label block text-[10px] text-frost/50">Meals</span>
              {p.mealPlan}
            </p>
            <p>
              <span className="label block text-[10px] text-frost/50">Overnight</span>
              {last || stop.nights === 0 ? "—" : `${stop.stay}, ${stop.place}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Enquiry({ p }: { p: Package }) {
  const [travellers, setTravellers] = useState(2);
  const [sent, setSent] = useState(false);
  const total = p.price * travellers;
  const off = offPercent(p);

  // ponytail: no backend yet — hands the enquiry to the visitor's mail app; swap for an API route when the CRM is ready
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = [
      `Package: ${p.title} (${p.country})`,
      `Name: ${f.get("name")}`,
      `Email: ${f.get("email")}`,
      `Departure: ${f.get("date") || "Flexible"}`,
      `Travellers: ${travellers}`,
      `Estimate: ${money(total)}`,
      `Notes: ${f.get("notes") || "-"}`,
    ].join("\n");
    window.location.href = `mailto:hello@alsafr.travel?subject=${encodeURIComponent(`Enquiry: ${p.title}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="frost-glass overflow-hidden rounded-3xl p-6">
      <p className="label text-frost/60">Starting from</p>
      {p.was && (
        <p className="mt-1 text-sm">
          <span className="text-ice/40 line-through">{money(p.was)}</span> <span className="text-sand">{off}% off</span>
        </p>
      )}
      <p className="text-5xl font-light tracking-tight">
        {money(p.price)}
        <span className="text-base text-ice/50"> /person</span>
      </p>
      <p className="mt-1 text-sm text-ice/50">
        {durationLabel(p)} · {p.flights ? "flights included" : "land only"}
      </p>

      {sent ? (
        <div className="mt-8 animate-[pop_.6s_cubic-bezier(.2,1.4,.4,1)] rounded-2xl bg-glow/10 p-6 text-center">
          <p className="text-4xl">✦</p>
          <p className="mt-3 text-xl font-semibold">Your enquiry is ready</p>
          <p className="mt-2 text-sm text-ice/60">Send the email that just opened and a travel designer will reply within 24 hours.</p>
          <button onClick={() => setSent(false)} className="label mt-5 text-glow hover:underline">
            Edit enquiry
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <select name="date" defaultValue={formatDate(p.departures[0])} aria-label="Departure date" className="field [&>option]:bg-ink">
            {p.departures.map((d) => (
              <option key={d} value={formatDate(d)}>
                Departing {formatDate(d)}
              </option>
            ))}
            <option value="">Flexible / other dates</option>
          </select>
          <div className="flex items-center justify-between rounded-xl border border-ice/15 px-4 py-2">
            <span className="text-sm text-ice/70">Travellers</span>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Fewer travellers" onClick={() => setTravellers((t) => Math.max(1, t - 1))} className="size-8 rounded-full border border-ice/20 hover:border-glow">
                −
              </button>
              <span key={travellers} className="w-5 animate-[pop_.4s_ease-out] text-center tabular-nums">
                {travellers}
              </span>
              <button type="button" aria-label="More travellers" onClick={() => setTravellers((t) => Math.min(20, t + 1))} className="size-8 rounded-full border border-ice/20 hover:border-glow">
                +
              </button>
            </div>
          </div>
          <input name="name" required placeholder="Full name" autoComplete="name" className="field" />
          <input name="email" type="email" required placeholder="Email" autoComplete="email" className="field" />
          <textarea name="notes" rows={2} placeholder="Anything we should know?" className="field resize-none" />
          <div className="flex items-baseline justify-between pt-2">
            <span className="label text-frost/60">Estimated total</span>
            <span key={total} className="animate-[pop_.4s_ease-out] text-2xl font-light">
              {money(total)}
            </span>
          </div>
          <Magnetic strength={0.15} className="block">
            <button className="group relative w-full overflow-hidden rounded-full bg-ice py-4 font-medium text-ink">
              <span className="absolute inset-0 translate-y-full bg-glow transition-transform duration-500 group-hover:translate-y-0" />
              <span className="relative">
                <RollText>Request this package</RollText>
              </span>
            </button>
          </Magnetic>
          <ul className="space-y-1.5 pt-2 text-xs text-ice/50">
            <li>✓ {p.freeCancellation ? "Free cancellation up to 45 days before" : "25% deposit confirms your booking"}</li>
            <li>✓ Reply from a travel designer within 24 hours</li>
          </ul>
        </form>
      )}
    </div>
  );
}
