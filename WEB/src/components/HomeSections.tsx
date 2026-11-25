"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatDate } from "@/data/packages";
import { useSite } from "./ContentProvider";
import TripFinder from "./TripFinder";
import { Countdown } from "./SiteChrome";
import AnimatedTestimonials, { type Review } from "./fx/AnimatedTestimonials";
import ImageTrail from "./fx/ImageTrail";
import { Button, Reveal, Scramble } from "./ui";

/* Browse by holiday style: one tile per category, linking into the filtered catalogue */
export function Styles() {
  const { categories, packages } = useSite();
  const root = useRef<HTMLElement>(null);
  const styles = categories.slice(1).map((c) => {
    const list = packages.filter((p) => p.category === c);
    return { name: c, count: list.length, from: Math.min(...list.map((p) => p.price)), image: list[0].image, picks: list.slice(0, 3).map((p) => p.title) };
  });
  useGSAP(
    () => {
      gsap.fromTo(
        "[data-style]",
        { clipPath: "inset(100% 0% 0% 0%)", y: 60 },
        { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.3, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 75%" } },
      );
    },
    { scope: root },
  );
  return (
    <section ref={root} id="styles" className="mx-auto max-w-7xl px-5 py-20 md:px-10">
      <div className="mb-20">
        <TripFinder />
      </div>
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Scramble className="label mb-4 block text-glow">[ 01 ] Find your kind of trip</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            Five ways to travel.
          </Reveal>
        </div>
        <p className="max-w-sm text-ice/60">Every tour is a complete package — pick the mood, we handle the flights, rooms, guides and transfers.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:h-[540px] lg:gap-3">
        {styles.map((st, i) => (
          <Link
            key={st.name}
            href={`/packages?cat=${st.name}`}
            data-style
            data-cursor="Browse"
            className={`group relative overflow-hidden rounded-[28px] border border-ice/10 transition-[flex-grow] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] lg:aspect-auto lg:h-full lg:flex-1 lg:hover:flex-[3.2] ${i === 0 ? "aspect-[4/5] sm:col-span-2 sm:aspect-[16/10]" : "aspect-[4/5]"}`}
          >
            <Image src={st.image} alt="" fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="label text-glow">
                {st.count} {st.count === 1 ? "tour" : "tours"}
              </p>
              <p className="mt-1 font-serif text-4xl italic">{st.name}</p>
              <ul className="grid max-h-0 overflow-hidden text-sm text-ice/75 opacity-0 transition-all duration-700 group-hover:mt-3 group-hover:max-h-32 group-hover:opacity-100">
                {st.picks.map((t) => (
                  <li key={t} className="whitespace-nowrap">
                    ✦ {t}
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex items-center justify-between text-sm text-ice/70">
                From ${st.from.toLocaleString("en-US")}
                <span className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">↗</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* Current offers: one large spotlight plus the rest as compact rows */
export function Deals() {
  const root = useRef<HTMLElement>(null);
  const { deals, settings } = useSite();
  const [lead, ...rest] = deals;
  useGSAP(
    () => {
      gsap.from("[data-deal]", { y: 80, opacity: 0, stagger: 0.12, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 70%" } });
      gsap.fromTo("[data-deal-img] img", { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );
  const was = (p: (typeof deals)[number]) => p.was ?? p.price;
  return (
    <section ref={root} id="deals" className="mx-auto max-w-7xl px-5 py-28 md:px-10">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Scramble className="label mb-4 block text-glow">[ 03 ] Hot deals</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            Same journeys, sharper prices.
          </Reveal>
        </div>
        <div className="flex items-center gap-3">
          <span className="label animate-pulse text-sand">🔥 Offers end in</span>
          <Countdown to={settings.hotDealEnds} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Link href={`/packages/${lead.slug}`} data-deal data-cursor="View" className="group relative block min-h-[480px] overflow-hidden rounded-[32px] border border-ice/10">
          <span aria-hidden className="border-beam" />
          <div data-deal-img className="absolute inset-0">
            <Image src={lead.image} alt={`${lead.place}, ${lead.country}`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <span className="label absolute left-6 top-6 rounded-full bg-sand px-3 py-1.5 text-ink">Save {money(was(lead) - lead.price)} pp</span>
          <div className="absolute inset-x-0 bottom-0 p-7">
            <p className="label text-glow">
              {lead.country} · {lead.days} days · {lead.tourStyle}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{lead.title}</p>
            <p className="mt-2 max-w-md text-ice/70">{lead.tagline}</p>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <p className="text-3xl font-light">
                <span className="mr-3 text-lg text-ice/40 line-through">{money(was(lead))}</span>
                {money(lead.price)}
                <span className="text-sm text-ice/50"> /person</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {lead.departures.slice(0, 3).map((d) => (
                  <span key={d} className="frost-glass rounded-full px-3 py-1.5 text-xs">
                    {formatDate(d)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
        <div className="grid gap-6">
          {rest.map((p) => (
            <Link
              key={p.slug}
              href={`/packages/${p.slug}`}
              data-deal
              data-cursor="View"
              className="group relative grid grid-cols-[120px_1fr] gap-5 overflow-hidden rounded-[28px] border border-ice/10 bg-night p-3 transition-colors hover:border-glow/40 sm:grid-cols-[160px_1fr]"
            >
              <span aria-hidden className="border-beam [animation-delay:-2s]" />
              <div className="relative overflow-hidden rounded-[20px]">
                <Image src={p.image} alt={`${p.place}, ${p.country}`} fill sizes="160px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="py-3 pr-3">
                <span className="label rounded-full bg-sand/15 px-2.5 py-1 text-sand">Save {money(was(p) - p.price)}</span>
                <p className="mt-3 text-2xl font-semibold leading-tight">{p.title}</p>
                <p className="label mt-1 text-frost/60">
                  {p.country} · {p.days} days
                </p>
                <p className="mt-4 text-xl font-light">
                  <span className="mr-2 text-sm text-ice/40 line-through">{money(was(p))}</span>
                  {money(p.price)}
                </p>
                <p className="mt-1 text-xs text-ice/50">Next departure {formatDate(p.departures[0])}</p>
              </div>
            </Link>
          ))}
          <div data-deal className="flex items-center justify-between gap-4 rounded-[28px] border border-dashed border-ice/15 p-6">
            <p className="max-w-[16rem] text-sm text-ice/60">Prices are per person sharing. Flights are included where the package says so.</p>
            <Button href="/packages" variant="ghost">
              All tours
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const included = [
  ["✈", "Flights", "Return flights with checked bags, chosen for sensible times — not just the cheapest fare."],
  ["⌂", "Stays", "Hand-picked hotels, villas and lodges we have slept in ourselves."],
  ["⇄", "Transfers", "Private pick-ups at every arrival. Someone is always holding a sign with your name."],
  ["◎", "Guides", "Local experts who know which door to knock on and when the crowds leave."],
  ["◇", "Meals", "Breakfasts daily plus the dinners worth travelling for."],
  ["✦", "Experiences", "Balloons, boats, kitchens and cave tours — booked and timed for you."],
  ["⛨", "Insurance", "Comprehensive cover including cancellation and medical."],
  ["☏", "Concierge", "A real human on WhatsApp, 24/7, for the whole trip."],
] as const;

const stats = [
  [42, "+", "Countries planned"],
  [18000, "+", "Happy travellers"],
  [4.9, "", "Average rating"],
  [12, "", "Years on the road"],
] as const;

export function Included() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.from("[data-tile]", {
        y: 80,
        rotateX: -35,
        opacity: 0,
        transformOrigin: "50% 0%",
        stagger: { each: 0.08, grid: "auto", from: "start" },
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-grid]", start: "top 80%" },
      });
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 2.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => {
            el.textContent = end % 1 ? obj.v.toFixed(1) : Math.round(obj.v).toLocaleString("en-US");
          },
        });
      });
    },
    { scope: root },
  );

  const glow = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  return (
    <section ref={root} id="included" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10">
      <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Scramble className="label mb-4 block text-glow">[ 05 ] Complete packages</Scramble>
          <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
            Everything included. Really everything.
          </Reveal>
        </div>
        <p className="max-w-sm text-ice/60">One price, one booking, one point of contact. Here is what every Al-Safar package covers.</p>
      </div>

      <div data-grid className="grid gap-px overflow-hidden rounded-3xl border border-ice/10 bg-ice/10 [perspective:1000px] sm:grid-cols-2 lg:grid-cols-4">
        {included.map(([icon, title, desc], i) => (
          <article
            key={title}
            data-tile
            onPointerMove={glow}
            className="group relative min-h-56 overflow-hidden bg-ink p-7 transition-colors duration-500"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "radial-gradient(260px circle at var(--x) var(--y), rgba(14,143,179,.12), transparent 70%)" }}
            />
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-xl border border-ice/10 text-xl text-glow transition-transform duration-700 group-hover:rotate-[360deg] group-hover:border-glow/50">
                {icon}
              </span>
              <span className="label text-frost/40">0{i + 1}</span>
            </div>
            <h3 className="mt-10 text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ice/55">{desc}</p>
          </article>
        ))}
      </div>

      <div className="mt-20 grid grid-cols-2 gap-10 lg:grid-cols-4">
        {stats.map(([n, suffix, label]) => (
          <div key={label} className="border-l border-glow/40 pl-5">
            <p className="text-5xl font-light tracking-tight md:text-6xl">
              <span data-count={n}>0</span>
              <span className="text-glow">{suffix}</span>
            </p>
            <p className="label mt-3 text-frost/60">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  ["Choose", "Pick a package as it is, or start from one and tell us what to change."],
  ["Tailor", "A travel designer shapes dates, rooms and extras around you — usually within a day."],
  ["Confirm", "One payment, one itinerary in your inbox and a live trip page on your phone."],
  ["Travel", "Arrive to a waiting driver. We watch your flights and fix things before you notice."],
] as const;

export function Steps() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.to("[data-line]", {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: "[data-steps]", start: "top 60%", end: "bottom 60%", scrub: true },
      });
      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.2, x: 40 },
          {
            opacity: 1,
            x: 0,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 75%", end: "top 50%", scrub: true },
          },
        );
        gsap.to(el.querySelector("[data-dot]"), {
          scale: 1,
          backgroundColor: "#0e8fb3",
          scrollTrigger: { trigger: el, start: "top 60%", toggleActions: "play none none reverse" },
        });
      });
    },
    { scope: root },
  );
  return (
    <section ref={root} id="how" className="relative mx-auto grid max-w-7xl gap-16 px-5 py-28 md:px-10 lg:grid-cols-2">
      <div className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:self-start">
        <Scramble className="label mb-4 block text-glow">[ 06 ] How it works</Scramble>
        <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
          Four steps from daydream to departure.
        </Reveal>
        <p className="mt-6 max-w-md text-ice/60">No forms longer than this sentence. Talk to a person, get a plan, go.</p>
      </div>
      <div data-steps className="relative pl-10">
        <div className="absolute left-[7px] top-0 h-full w-px bg-ice/10">
          <div data-line className="h-full origin-top scale-y-0 bg-gradient-to-b from-glow to-sand" />
        </div>
        {steps.map(([title, desc], i) => (
          <div key={title} data-step className="relative pb-24 last:pb-0">
            <span data-dot className="absolute -left-10 top-3 size-[15px] scale-50 rounded-full border border-glow bg-ink" />
            <p className="label text-frost/50">Step 0{i + 1}</p>
            <h3 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h3>
            <p className="mt-4 max-w-md text-lg text-ice/60">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const reviews: Review[] = [
  { quote: "The seaplane landed and someone already knew our names. That was the whole trip.", name: "Aisha R.", where: "Maldives", trip: "Overwater Escape", slug: "maldives-overwater-escape", rating: 5 },
  { quote: "We changed hotels twice mid-trip. Two WhatsApp messages. Done.", name: "Marco & Lena", where: "Japan", trip: "Kyoto Seasons", slug: "kyoto-seasons", rating: 5 },
  { quote: "The balloon at dawn over the Mara — I still don't have words.", name: "Fahad K.", where: "Kenya", trip: "Great Migration", slug: "kenya-great-migration", rating: 5 },
  { quote: "Every transfer was waiting. Every one. In India. Unreal.", name: "Priya S.", where: "India", trip: "Golden Triangle", slug: "india-golden-triangle", rating: 5 },
  { quote: "Our kids now judge every holiday against Iceland.", name: "The Okafors", where: "Iceland", trip: "Aurora Hunt", slug: "iceland-aurora-hunt", rating: 5 },
  { quote: "Best decision: letting them plan the wine days in Santorini.", name: "Hannah W.", where: "Greece", trip: "Caldera Days", slug: "santorini-caldera-days", rating: 5 },
];

export function Testimonials() {
  return <AnimatedTestimonials reviews={reviews} />;
}

// smaller crops for the cursor trail

export function Cta() {
  const { packages } = useSite();
  const trailImages = packages.map((p) => ({ src: p.image.replace("w=1600", "w=420"), alt: p.country }));
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        "[data-orb]",
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: true } },
      );
    },
    { scope: root },
  );
  return (
    <section ref={root} id="contact" className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-28 text-center">
      <div data-orb className="absolute left-1/2 top-1/2 size-[90vmin] -translate-x-1/2 -translate-y-1/2 opacity-0">
        <div
          className="size-full animate-[spin_18s_linear_infinite] rounded-full blur-3xl"
          style={{ background: "conic-gradient(from 0deg, #0e8fb340, #c97a2b33, #0e8fb310, #0e8fb340)" }}
        />
      </div>
      <ImageTrail images={trailImages} className="absolute inset-0 flex items-center justify-center px-5">
        <Scramble className="label mb-8 block text-glow">[ 08 ] Ready when you are</Scramble>
        <Reveal as="h2" type="chars" className="text-[16vw] font-semibold leading-[0.85] tracking-[-0.05em] md:text-[11vw]">
          Where to next?
        </Reveal>
        <p className="mx-auto mt-8 max-w-md text-ice/60">
          Tell us a month and a mood. We&apos;ll come back with a complete plan — usually within 24 hours.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href="/packages">Find my package</Button>
          <Button href="mailto:hello@alsafr.travel" variant="ghost">
            hello@alsafr.travel
          </Button>
        </div>
        <p className="label mt-10 hidden text-ice/40 md:block">Move your cursor — see where we go</p>
      </ImageTrail>
    </section>
  );
}
