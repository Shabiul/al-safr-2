"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { BOOKING_FORMS, type TravelLink } from "@/data/updates";
import { sendBooking } from "@/app/(site)/actions";
import { useSite } from "./ContentProvider";
import { Reveal, Scramble } from "./ui";

const ICON: Record<TravelLink["kind"], React.ReactNode> = {
  flights: <path d="M2 16l20-8-2-2-8 3-5-5-2 1 3 6-4 2-2-1-1 1 3 3z" />,
  hotels: <path d="M3 20V6h8v6h10v8M3 16h18M7 10h.01M14 12V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3" />,
  buses: <path d="M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11M5 11h14M5 17h14v2H5zM8 20v1M16 20v1M8 14h.01M16 14h.01" />,
  cabs: <path d="M5 17h14v-5l-2-5H7l-2 5zM5 12h14M7 17v2M17 17v2M9 4h6" />,
  trains: <path d="M7 3h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 11h14M9 21l1-3M15 21l-1-3M9 15h.01M15 15h.01" />,
  visa: <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h3" />,
  insurance: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  other: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" />,
};

const CODES = [
  ["+971", "UAE"],
  ["+91", "India"],
  ["+92", "Pakistan"],
  ["+880", "Bangladesh"],
  ["+63", "Philippines"],
  ["+94", "Sri Lanka"],
  ["+977", "Nepal"],
  ["+966", "Saudi Arabia"],
  ["+974", "Qatar"],
  ["+44", "UK"],
  ["+1", "USA / Canada"],
];

type Slide = { id: string; label: string; node: React.ReactNode };
const today = () => new Date().toISOString().slice(0, 10);
const pair = (l: string) => {
  const [name, iso = ""] = l.split("|").map((x) => x.trim());
  return { name, iso: iso.toLowerCase() };
};

/** the "Book it yourself" section: a slider of the Dummy ticket form, the Rail form and partner links; all managed in the CRM (Website content) */
export default function TravelLinks() {
  const site = useSite();
  const links = site.travelLinks.filter((l) => l.enabled);
  const forms = { ...BOOKING_FORMS, ...site.forms };
  const slides = (
    [
      forms.dummyEnabled && {
        id: "dummy",
        label: "Dummy ticket",
        node: <DummyTicket f={forms} />,
      },
      forms.railEnabled && {
        id: "rail",
        label: "Train & rail",
        node: <Rail f={forms} />,
      },
      links.length > 0 && {
        id: "links",
        label: "Flights, hotels & more",
        node: <Links links={links} />,
      },
    ] as (Slide | false)[]
  ).filter((s): s is Slide => !!s);

  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  if (!slides.length) return null;
  const go = (i: number) => {
    const el = track.current;
    if (el)
      el.scrollTo({
        left: Math.max(0, Math.min(slides.length - 1, i)) * el.clientWidth,
        behavior: "smooth",
      });
  };

  return (
    <div className="relative isolate overflow-hidden">
      {forms.bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- CRM-managed photo, any allowed host */}
          <img src={forms.bgImage} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-ink/75" />
        </>
      )}
      <section id="book" className="mx-auto max-w-[88rem] px-5 py-28 md:px-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Scramble className="label mb-4 block text-glow">[ ↗ ] Book it yourself</Scramble>
            <Reveal as="h2" type="words" className="text-5xl font-semibold leading-[0.9] tracking-tight md:text-7xl">
              Just need one piece of the trip?
            </Reveal>
            <p className="mt-4 text-ice/60">
              Get a dummy ticket, a rail booking, or book flights and stays through our partners — or let us handle the whole journey.
            </p>
          </div>
          {slides.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => go(at - 1)}
                disabled={at === 0}
                aria-label="Previous"
                className="size-11 rounded-full border border-ice/15 transition-colors enabled:hover:border-glow enabled:hover:text-glow disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={() => go(at + 1)}
                disabled={at === slides.length - 1}
                aria-label="Next"
                className="size-11 rounded-full border border-ice/15 transition-colors enabled:hover:border-glow enabled:hover:text-glow disabled:opacity-30"
              >
                →
              </button>
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <div role="tablist" className="mb-5 flex flex-wrap gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === at}
                onClick={() => go(i)}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${i === at ? "border-glow bg-glow text-ink" : "border-ice/15 hover:border-glow"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div
          ref={track}
          onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s) => (
            <div key={s.id} className="w-full shrink-0 snap-center">
              {s.node}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="mt-5 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => go(i)}
                aria-label={`Show ${s.label}`}
                className={`h-1.5 rounded-full transition-all ${i === at ? "w-8 bg-glow" : "w-3 bg-ice/20"}`}
              />
            ))}
          </div>
        )}
        <p className="mt-6 text-xs text-ice/40">
          Dummy ticket and rail requests are answered by our team on the number you give. Partner links open in a new tab; bookings made there are with that
          partner.
        </p>
      </section>
    </div>
  );
}

/* ---------- partner links ---------- */

function Links({ links }: { links: TravelLink[] }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${links.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {links.map((l, i) => (
        <motion.a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            type: "spring",
            bounce: 0.2,
            duration: 0.7,
            delay: i * 0.08,
          }}
          whileHover={{ y: -6 }}
          data-cursor="Open"
          className="group flex min-h-72 flex-col rounded-[32px] border border-ice/10 bg-night p-8 shadow-[0_20px_50px_-30px_rgba(0,0,0,.35)] transition-colors hover:border-glow"
        >
          <span className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-glow/12 text-glow transition-colors group-hover:bg-glow group-hover:text-ink">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              {ICON[l.kind] ?? ICON.other}
            </svg>
          </span>
          <span className="text-3xl font-semibold">{l.label}</span>
          <span className="mt-2 flex-1 text-sm text-ice/60">{l.blurb}</span>
          <span className="label mt-6 flex items-center gap-2 text-glow">
            {l.cta || "Open"} <span className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
          </span>
        </motion.a>
      ))}
    </div>
  );
}

/* ---------- shared form bits ---------- */

const panel = "grid gap-10 rounded-[32px] border border-ice/10 bg-night p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,.35)] md:p-12";
const opt = "[&>option]:bg-ink";

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ice/60">{text}</span>
      {children}
    </label>
  );
}

function Pills({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={o === value}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${o === value ? "border-glow bg-glow text-ink" : "border-ice/15 hover:border-glow"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** adults / seniors / children steppers in a dropdown; posts adults, seniors and children */
function Pax({ seniors = true }: { seniors?: boolean }) {
  const [n, setN] = useState({ adults: 1, seniors: 0, children: 0 });
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  const rows = [
    ["adults", "Adults", "12+ years", 1],
    ...(seniors ? [["seniors", "Seniors", "60+ years", 0] as const] : []),
    ["children", "Children", "0–11 years", 0],
  ] as const;
  const total = n.adults + n.seniors + n.children;
  return (
    <div ref={box} className="relative">
      {rows.map(([k]) => (
        <input key={k} type="hidden" name={k} value={n[k]} />
      ))}
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="field flex items-center justify-between text-left">
        <span>
          {total} traveller{total > 1 ? "s" : ""}
        </span>
        <span aria-hidden className="text-ice/50">
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 space-y-3 rounded-2xl border border-ice/15 bg-ink p-4 shadow-2xl">
          {rows.map(([k, name, hint, min]) => (
            <div key={k} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-ice/50">{hint}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`Fewer ${name}`}
                  onClick={() => setN({ ...n, [k]: Math.max(min, n[k] - 1) })}
                  className="size-8 rounded-full border border-ice/20 hover:border-glow"
                >
                  −
                </button>
                <span className="w-4 text-center tabular-nums">{n[k]}</span>
                <button
                  type="button"
                  aria-label={`More ${name}`}
                  onClick={() => setN({ ...n, [k]: Math.min(9, n[k] + 1) })}
                  className="size-8 rounded-full border border-ice/20 hover:border-glow"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Phone() {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3">
      <Label text="Country code">
        <select name="code" defaultValue="+971" className={`field ${opt}`}>
          {CODES.map(([c, n]) => (
            <option key={n} value={c}>
              {n} ({c})
            </option>
          ))}
        </select>
      </Label>
      <Label text="Mobile no">
        <input name="phone" type="tel" inputMode="tel" required placeholder="Mobile no" autoComplete="tel-national" className="field" />
      </Label>
    </div>
  );
}

/** wraps a form: honeypot, posting, and the thank-you state */
function BookingForm({ kind, children, cta, done }: { kind: "dummy" | "rail"; children: React.ReactNode; cta: string; done: string }) {
  const [state, send, pending] = useActionState(sendBooking, { ok: false });
  if (state.ok)
    return (
      <div role="status" className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-glow text-2xl text-ink">✓</span>
        <p className="text-2xl font-semibold">Request received</p>
        <p className="max-w-sm text-sm text-ice/60">{done}</p>
      </div>
    );
  return (
    <form action={send} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {children}
      {state.error && (
        <p role="alert" className="text-sm text-sand">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-glow py-3.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Sending…" : cta}
      </button>
    </form>
  );
}

/* ---------- dummy ticket ---------- */

type Forms = typeof BOOKING_FORMS;

function DummyTicket({ f }: { f: Forms }) {
  const [trip, setTrip] = useState("One Way");
  const [dep, setDep] = useState("");
  const classes = f.dummyClasses.length ? f.dummyClasses : ["Economy"];
  return (
    <div className={`${panel} lg:grid-cols-[1fr_minmax(0,34rem)] lg:items-center`}>
      <div className="text-center lg:px-6">
        <p className="text-3xl font-light text-sand md:text-5xl">{f.dummyEyebrow}</p>
        <h3 className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-5xl">{f.dummyHeadline}</h3>
        <p className="mt-3 text-3xl font-bold tracking-tight text-glow md:text-5xl">{f.dummyPromise}</p>
        <p className="mt-4 text-xl font-semibold md:text-2xl">{f.dummyTag}</p>
        <div className="mx-auto mt-8 max-w-md space-y-1 text-sm text-ice/60">
          {f.dummyBlurb.split("\n").map((l, i) => (
            <p key={i} className={i === 0 ? "font-semibold text-ice" : ""}>
              {l}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-ice/10 bg-ink/40 p-5 md:p-7">
        <BookingForm kind="dummy" cta="Book" done="Our team will contact you on the number you gave, usually within 30 minutes.">
          <input type="hidden" name="trip" value={trip} />
          <Pills value={trip} options={["One Way", "Round Trip"]} onChange={setTrip} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Label text="From">
              <input name="from" required placeholder="From where?" autoComplete="off" className="field" />
            </Label>
            <Label text="To">
              <input name="to" required placeholder="To where?" autoComplete="off" className="field" />
            </Label>
            <Label text="Departure">
              <input name="date" type="date" required min={today()} value={dep} onChange={(e) => setDep(e.target.value)} className="field" />
            </Label>
            {trip === "Round Trip" && (
              <Label text="Return date">
                <input name="return" type="date" required min={dep || today()} className="field" />
              </Label>
            )}
            <Label text="Travellers">
              <Pax seniors={false} />
            </Label>
            <Label text="Class">
              <select name="class" defaultValue={classes[0]} className={`field ${opt}`}>
                {classes.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Label>
          </div>
          <Phone />
        </BookingForm>
      </div>
    </div>
  );
}

/* ---------- rail ---------- */

const PRODUCTS = [
  ["Train Ticket (Europe)", "Travel across Europe"],
  ["Rail Passes (Europe)", "Flexible passes for Europe"],
  ["Train Ticket (Global)", "Travel beyond Europe"],
] as const;

function Flag({ iso }: { iso: string }) {
  return iso ? (
    // eslint-disable-next-line @next/next/no-img-element -- tiny flag from flagcdn
    <img src={`https://flagcdn.com/w40/${iso}.png`} alt="" width={28} height={20} loading="lazy" className="h-5 w-7 rounded-sm object-cover" />
  ) : null;
}

function Rail({ f }: { f: Forms }) {
  const [p, setP] = useState(0);
  const [country, setCountry] = useState("");
  const globals = f.railCountries.map(pair);
  const passes = f.railPassCountries.map(pair);
  const nats = f.nationalities.length ? f.nationalities : ["Other"];
  return (
    <div className={`${panel} gap-8`}>
      <div role="tablist" className="grid gap-3 md:grid-cols-3">
        {PRODUCTS.map(([name, sub], i) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={i === p}
            onClick={() => {
              setP(i);
              setCountry("");
            }}
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-colors ${i === p ? "border-glow bg-glow/10" : "border-ice/10 hover:border-glow/60"}`}
          >
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${i === p ? "border-glow" : "border-ice/30"}`}>
              {i === p && <span className="size-2.5 rounded-full bg-glow" />}
            </span>
            <span>
              <span className="block font-semibold">
                {name}
                {i === 2 && <span className="ml-2 rounded-md bg-glow px-1.5 py-0.5 align-middle text-[10px] font-bold text-ink">NEW</span>}
              </span>
              <span className="block text-xs text-ice/55">{sub}</span>
            </span>
          </button>
        ))}
      </div>

      <BookingForm
        key={p}
        kind="rail"
        cta={p === 1 ? "Let's find passes →" : "Search trains →"}
        done="Our rail desk will send you options and prices on the number you gave."
      >
        <input type="hidden" name="product" value={PRODUCTS[p][0]} />
        {p === 2 && (
          <div className="rounded-2xl bg-ice/5 p-4">
            <p className="mb-3 text-sm font-semibold">Popular global destinations</p>
            <div className="flex flex-wrap gap-2">
              {globals.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => setCountry(g.name)}
                  aria-pressed={country === g.name}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${country === g.name ? "border-glow bg-glow/10" : "border-ice/15 hover:border-glow"}`}
                >
                  <Flag iso={g.iso} />
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {p === 2 && <input type="hidden" name="country" value={country} />}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {p === 1 ? (
            <Label text="Country to visit *">
              <select name="country" required defaultValue={passes[0]?.name} className={`field ${opt}`}>
                {passes.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </Label>
          ) : (
            <>
              <Label text="From (origin city / station) *">
                <input name="from" required placeholder="Enter origin city or station" autoComplete="off" className="field" />
              </Label>
              <Label text="To (destination city / station) *">
                <input name="to" required placeholder="Enter destination city or station" autoComplete="off" className="field" />
              </Label>
            </>
          )}
          <Label text={p === 1 ? "Valid from *" : "Departure date & time *"}>
            <div className="flex gap-2">
              <input name="date" type="date" required min={today()} className="field" />
              {p !== 1 && <input name="time" type="time" defaultValue="06:00" className="field w-32 shrink-0" />}
            </div>
          </Label>
          <Label text="Pax information *">
            <Pax />
          </Label>
          <Label text="Nationality or residency *">
            <select name="nationality" defaultValue={nats[0]} className={`field ${opt}`}>
              {nats.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Label>
        </div>
        {f.railNotice && <p className="rounded-xl border border-sand/40 bg-sand/10 px-4 py-3 text-xs text-ice/75">ⓘ {f.railNotice}</p>}
        <div className="md:max-w-md">
          <Phone />
        </div>
      </BookingForm>
    </div>
  );
}
