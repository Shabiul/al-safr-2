"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  activitiesOf,
  durationLabel,
  formatDate,
  formatMonth,
  nightsOf,
  offPercent,
  placesLabel,
  routeLabel,
  tourStyles,
  type Package,
} from "@/data/packages";
import { navBottom, scrollToEl } from "./SmoothScroll";
import { useSite } from "./ContentProvider";
import { Reveal, Scramble } from "./ui";

type Initial = { cat?: string; q?: string; month?: string };

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const durations = [
  { id: "day", label: "Day trip", test: (n: number) => n === 0 },
  { id: "short", label: "1 – 5 nights", test: (n: number) => n >= 1 && n <= 5 },
  { id: "mid", label: "6 – 8 nights", test: (n: number) => n >= 6 && n <= 8 },
  { id: "long", label: "9+ nights", test: (n: number) => n >= 9 },
];

const budgets = [
  { id: "b1", label: "Under $500", test: (p: number) => p < 500 },
  { id: "b2", label: "$500 – $1,500", test: (p: number) => p >= 500 && p <= 1500 },
  { id: "b3", label: "$1,500 – $3,000", test: (p: number) => p > 1500 && p <= 3000 },
  { id: "b4", label: "Over $3,000", test: (p: number) => p > 3000 },
];

const sorts: Record<string, { label: string; fn: (a: Package, b: Package) => number }> = {
  relevance: { label: "Relevance", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a, b) => b.price - a.price },
  rating: { label: "Rating: high to low", fn: (a, b) => b.rating - a.rating },
  duration: { label: "Duration: shortest", fn: (a, b) => nightsOf(a) - nightsOf(b) },
  soonest: { label: "Soonest departure", fn: (a, b) => a.departures[0].localeCompare(b.departures[0]) },
};

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

// The static shell renders the full catalogue; once the URL is known it re-mounts with the hero finder's filters.
export default function PackageSearchPage() {
  return (
    <Suspense fallback={<PackageSearch />}>
      <FromSearchParams />
    </Suspense>
  );
}

function FromSearchParams() {
  const params = useSearchParams();
  const { categories } = useSite();
  const cat = params.get("cat") ?? undefined;
  const initial: Initial = {
    cat: cat && (categories as readonly string[]).includes(cat) ? cat : undefined,
    q: params.get("q") ?? undefined,
    month: params.get("month") ?? undefined,
  };
  return <PackageSearch key={params.toString()} initial={initial} />;
}

function PackageSearch({ initial = {} }: { initial?: Initial }) {
  const { packages, categories, departureMonths, countries } = useSite();
  const maxPrice = Math.max(0, ...packages.map((p) => p.price));
  const destinations = [...countries].sort();
  const [q, setQ] = useState(initial.q ?? "");
  const [month, setMonth] = useState(initial.month ?? "");
  const [guests, setGuests] = useState(2);
  const [dest, setDest] = useState<string[]>([]);
  const [destQuery, setDestQuery] = useState("");
  const [showAllDest, setShowAllDest] = useState(false);
  const [dur, setDur] = useState<string[]>([]);
  const [budget, setBudget] = useState(maxPrice);
  const [budgetBands, setBudgetBands] = useState<string[]>([]);
  const [stars, setStars] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>(initial.cat ? [initial.cat] : []);
  const [freeCancel, setFreeCancel] = useState(false);
  const [withFlights, setWithFlights] = useState(false);
  const [withMeals, setWithMeals] = useState(false);
  const [sort, setSort] = useState(initial.month ? "soonest" : "relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  // every filter except the tour-type tabs, so the tab counts stay meaningful
  const base = useMemo(() => {
    const term = q.trim().toLowerCase();
    return packages.filter(
      (p) =>
        (!term || `${p.title} ${p.place} ${p.country} ${p.route.map((s) => s.place).join(" ")}`.toLowerCase().includes(term)) &&
        (!month || p.departures.some((d) => d.startsWith(month))) &&
        (!dest.length || dest.includes(p.country)) &&
        (!dur.length || durations.some((d) => dur.includes(d.id) && d.test(nightsOf(p)))) &&
        p.price <= budget &&
        (!budgetBands.length || budgets.some((b) => budgetBands.includes(b.id) && b.test(p.price))) &&
        (!stars.length || stars.includes(String(p.stars))) &&
        (!themes.length || themes.includes(p.category)) &&
        (!freeCancel || p.freeCancellation) &&
        (!withFlights || p.flights) &&
        (!withMeals || p.mealPlan !== "Breakfast"),
    );
  }, [packages, q, month, dest, dur, budget, budgetBands, stars, themes, freeCancel, withFlights, withMeals]);

  const list = base.filter((p) => !types.length || types.includes(p.tourStyle)).sort(sorts[sort].fn);
  const activeCount =
    dest.length + dur.length + budgetBands.length + stars.length + types.length + themes.length + +freeCancel + +withFlights + +withMeals + +(budget < maxPrice);

  const clearAll = () => {
    setDest([]);
    setDur([]);
    setBudget(maxPrice);
    setBudgetBands([]);
    setStars([]);
    setTypes([]);
    setThemes([]);
    setFreeCancel(false);
    setWithFlights(false);
    setWithMeals(false);
    setQ("");
    setMonth("");
  };

  const count = (test: (p: Package) => boolean) => packages.filter(test).length;
  const destList = destinations.filter((d) => d.toLowerCase().includes(destQuery.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-5 pb-32 md:px-10">
      <Scramble className="label mb-4 block text-glow">{`[ Tours ] ${packages.length} holiday packages`}</Scramble>
      <Reveal as="h1" type="chars" immediate className="text-5xl font-semibold leading-[0.9] tracking-[-0.04em] md:text-7xl">
        Find your holiday.
      </Reveal>

      {/* search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const el = document.getElementById("results");
          if (el) scrollToEl(el, -(navBottom() + 96)); // clear the pinned navbar and the sticky search bar
        }}
        className="frost-glass sticky top-[calc(var(--nav-h)+0.5rem)] z-30 mt-10 grid gap-1 rounded-3xl p-2 md:grid-cols-[1.4fr_1fr_0.8fr_auto] md:items-center md:rounded-full"
      >
        <label className="flex flex-col gap-1 px-5 py-3 md:border-r md:border-ice/10">
          <span className="label text-[10px] text-frost/60">Going to</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            list="search-places"
            placeholder="Kerala, Dubai, Bali…"
            className="bg-transparent text-sm outline-none placeholder:text-ice/40"
          />
          <datalist id="search-places">
            {[...new Set(packages.flatMap((p) => [p.country, ...p.route.map((s) => s.place)]))].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 px-5 py-3 md:border-r md:border-ice/10">
          <span className="label text-[10px] text-frost/60">Starting date</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-sm outline-none [&>option]:bg-ink">
            <option value="">Any month</option>
            {departureMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 px-5 py-3">
          <span className="label text-[10px] text-frost/60">Guests</span>
          <div className="flex items-center gap-3 text-sm">
            <button type="button" aria-label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="size-6 rounded-full border border-ice/20 hover:border-glow">
              −
            </button>
            <span className="tabular-nums">{guests} adults</span>
            <button type="button" aria-label="More guests" onClick={() => setGuests((g) => Math.min(20, g + 1))} className="size-6 rounded-full border border-ice/20 hover:border-glow">
              +
            </button>
          </div>
        </div>
        <button className="rounded-full bg-glow px-8 py-4 text-sm font-semibold text-ink transition-colors hover:bg-ice">Search</button>
      </form>

      <div id="results" className="mt-10 grid scroll-mt-48 gap-8 lg:grid-cols-[270px_1fr]">
        {/* filters */}
        <aside>
          <button onClick={() => setFiltersOpen((o) => !o)} className="label mb-4 w-full rounded-full border border-ice/15 py-3 lg:hidden">
            {filtersOpen ? "Hide filters" : `Filters${activeCount ? ` (${activeCount})` : ""}`}
          </button>
          <div className={`${filtersOpen ? "block" : "hidden"} frost-glass rounded-3xl p-5 lg:sticky lg:top-[calc(var(--nav-h)+6rem)] lg:block lg:max-h-[calc(100vh-var(--nav-h)-7rem)] lg:overflow-y-auto`} data-lenis-prevent>
            <div className="mb-2 flex items-center justify-between">
              <p className="label text-ice">Filters</p>
              {activeCount > 0 && (
                <button onClick={clearAll} className="label text-glow hover:underline">
                  Clear all
                </button>
              )}
            </div>

            <Group title="Destination">
              <input
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                placeholder="Search destinations…"
                className="mb-3 w-full rounded-xl border border-ice/15 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ice/40 focus:border-glow"
              />
              {(showAllDest || destQuery ? destList : destList.slice(0, 6)).map((d) => (
                <Check key={d} label={d} n={count((p) => p.country === d)} on={dest.includes(d)} toggle={() => setDest((l) => toggle(l, d))} />
              ))}
              {!destQuery && destList.length > 6 && (
                <button onClick={() => setShowAllDest((s) => !s)} className="label mt-2 text-glow hover:underline">
                  {showAllDest ? "Show less" : `Show more (${destList.length - 6} more)`}
                </button>
              )}
            </Group>

            <Group title="Duration">
              {durations.map((d) => (
                <Check key={d.id} label={d.label} n={count((p) => d.test(nightsOf(p)))} on={dur.includes(d.id)} toggle={() => setDur((l) => toggle(l, d.id))} />
              ))}
            </Group>

            <Group title="Budget (per person)">
              <div className="mb-3 flex items-center justify-between text-sm text-ice/70">
                <span>$0</span>
                <span className="text-ice">≤ {money(budget)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                aria-label="Maximum budget per person"
                className="mb-3 w-full accent-[#0e8fb3]"
              />
              <p className="label mb-1 text-[10px] text-frost/50">Quick filters</p>
              {budgets.map((b) => (
                <Check key={b.id} label={b.label} n={count((p) => b.test(p.price))} on={budgetBands.includes(b.id)} toggle={() => setBudgetBands((l) => toggle(l, b.id))} />
              ))}
            </Group>

            <Group title="Hotel category">
              {["3", "4", "5"].map((s) => (
                <Check key={s} label={`${s}★`} n={count((p) => String(p.stars) === s)} on={stars.includes(s)} toggle={() => setStars((l) => toggle(l, s))} />
              ))}
            </Group>

            <Group title="Type of tour">
              {tourStyles.map((t) => (
                <Check key={t} label={t} n={count((p) => p.tourStyle === t)} on={types.includes(t)} toggle={() => setTypes((l) => toggle(l, t))} />
              ))}
            </Group>

            <Group title="Package theme">
              {categories.slice(1).map((c) => (
                <Check key={c} label={c} n={count((p) => p.category === c)} on={themes.includes(c)} toggle={() => setThemes((l) => toggle(l, c))} />
              ))}
            </Group>

            <Group title="Other filters" last>
              <Check label="Free cancellation" n={count((p) => !!p.freeCancellation)} on={freeCancel} toggle={() => setFreeCancel((v) => !v)} />
              <Check label="Flights included" n={count((p) => p.flights)} on={withFlights} toggle={() => setWithFlights((v) => !v)} />
              <Check label="Meals included" n={count((p) => p.mealPlan !== "Breakfast")} on={withMeals} toggle={() => setWithMeals((v) => !v)} />
            </Group>
          </div>
        </aside>

        <div className="min-w-0">
          {/* tour-type tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden" data-lenis-prevent>
            {[["All packages", base.length, !types.length, () => setTypes([])] as const, ...tourStyles.map((t) => [t, base.filter((p) => p.tourStyle === t).length, types.length === 1 && types[0] === t, () => setTypes([t])] as const)].map(
              ([label, n, on, act]) => (
                <button
                  key={label}
                  onClick={act}
                  className={`label relative shrink-0 rounded-full px-4 py-2.5 transition-colors ${on ? "text-ink" : "border border-ice/10 text-ice/70 hover:text-ice"}`}
                >
                  {on && <motion.span layoutId="type-tab" className="absolute inset-0 rounded-full bg-glow" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                  <span className="relative">
                    {label} ({n})
                  </span>
                </button>
              ),
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ice/60">
              Showing <span className="text-ice">{list.length}</span> of {packages.length} packages
            </p>
            <label className="flex items-center gap-3 text-sm text-ice/60">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-ice/15 bg-ink px-4 py-2 text-ice outline-none focus:border-glow">
                {Object.entries(sorts).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <motion.div layout className="mt-6 grid gap-6 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {list.map((p) => (
                <motion.div
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                >
                  <SearchCard p={p} guests={guests} saved={saved.includes(p.slug)} onSave={() => setSaved((l) => toggle(l, p.slug))} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {list.length === 0 && (
            <div className="mt-16 text-center">
              <p className="font-serif text-3xl italic text-ice/60">No packages match these filters.</p>
              <button onClick={clearAll} className="label mt-6 text-glow hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <details open className={`group/f py-4 ${last ? "" : "border-b border-ice/10"}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        {title}
        <span className="text-ice/50 transition-transform group-open/f:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 space-y-1">{children}</div>
    </details>
  );
}

function Check({ label, n, on, toggle }: { label: string; n: number; on: boolean; toggle: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm transition-colors ${n ? "text-ice/80 hover:text-ice" : "text-ice/30"}`}>
      <span className="flex items-center gap-2.5">
        <input type="checkbox" checked={on} onChange={toggle} className="size-4 accent-[#0e8fb3]" />
        {label}
      </span>
      <span className="text-xs text-ice/40">({n})</span>
    </label>
  );
}

function SearchCard({ p, guests, saved, onSave }: { p: Package; guests: number; saved: boolean; onSave: () => void }) {
  const off = offPercent(p);
  const meta = [
    p.flights && "Round-trip flights",
    `${"★".repeat(p.stars)} ${p.stars} star`,
    `${activitiesOf(p)} ${activitiesOf(p) === 1 ? "activity" : "activities"}`,
    p.mealPlan !== "Breakfast" && "Meals included",
    p.freeCancellation && "Free cancellation",
  ].filter(Boolean) as string[];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-ice/10 bg-night transition-colors hover:border-glow/40">
      <Link href={`/packages/${p.slug}`} data-cursor="View" className="absolute inset-0 z-10" aria-label={`View ${p.title}`} />
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={p.image} alt={`${p.place}, ${p.country}`} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-ink/30" />
        <button
          onClick={onSave}
          aria-label={saved ? "Remove from saved" : "Save package"}
          aria-pressed={saved}
          className={`absolute left-4 top-4 z-20 flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors ${saved ? "bg-sand text-ink" : "bg-ink/50 text-ice hover:text-sand"}`}
        >
          {saved ? "♥" : "♡"}
        </button>
        <span className="label absolute right-4 top-4 rounded-full bg-ink/60 px-2.5 py-1 text-ice backdrop-blur">★ {p.rating.toFixed(1)}</span>
        {(off > 0 || p.rating >= 5) && (
          <span className={`label absolute bottom-4 left-4 rounded-md px-2 py-1 ${off > 0 ? "bg-sand text-ink" : "bg-[#e5484d] text-white"}`}>{off > 0 ? `${off}% off` : "Hot"}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold leading-tight">{p.title}</h3>
          <span className="label shrink-0 rounded-md border border-glow/40 px-2 py-1 text-[10px] text-glow">{durationLabel(p)}</span>
        </div>
        <p className="mt-1 text-sm text-ice/60">{placesLabel(p)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="label rounded-md bg-glow/10 px-2 py-1 text-[10px] text-glow">{p.tourStyle}</span>
          <span className="text-xs text-ice/50">{routeLabel(p)}</span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ice/60">
          {meta.map((m, i) => (
            <li key={m} className="flex items-center gap-3">
              {i > 0 && <span className="text-ice/25">•</span>}
              {m}
            </li>
          ))}
        </ul>
        <ul className="mt-4 grid gap-x-4 gap-y-1.5 text-[13px] text-ice/75 sm:grid-cols-2">
          {p.highlights.slice(0, 6).map((h) => (
            <li key={h} className="flex gap-2">
              <span className="text-glow">✓</span>
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-ice/10 pt-4">
          <p className="text-xs text-ice/50">
            Next departure
            <br />
            <span className="text-ice/80">{formatDate(p.departures[0])}</span>
          </p>
          <div className="text-right">
            {p.was && (
              <p className="text-xs">
                <span className="text-ice/40 line-through">{money(p.was)}</span> <span className="text-sand">{off}% off</span>
              </p>
            )}
            <p className="text-2xl font-light">
              {money(p.price)}
              <span className="text-sm text-ice/50"> /person</span>
            </p>
            {guests > 1 && <p className="text-xs text-ice/40">{money(p.price * guests)} for {guests} adults</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
