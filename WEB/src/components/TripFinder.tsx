"use client";

import { useRouter } from "next/navigation";
import { formatMonth } from "@/data/packages";
import { useSite } from "./ContentProvider";
import { Magnetic } from "./ui";

/** Where / style / month → /packages with those filters applied. */
export default function TripFinder() {
  const { categories, departureMonths, countries } = useSite();
  const router = useRouter();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "cat", "month"]) {
      const v = String(f.get(key) ?? "").trim();
      if (v && v !== "All") params.set(key, v);
    }
    router.push(`/packages${params.size ? `?${params}` : ""}`);
  };
  const cell = "flex flex-col gap-1 px-5 py-3 md:border-r md:border-ice/10";
  return (
    <form onSubmit={submit} className="frost-glass grid w-full gap-1 rounded-3xl p-2 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:rounded-full">
      <label className={cell}>
        <span className="label text-[10px] text-frost/60">Where to</span>
        <input name="q" list="finder-places" placeholder="Any country or city" className="bg-transparent text-sm outline-none placeholder:text-ice/40" />
        <datalist id="finder-places">
          {countries.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className={cell}>
        <span className="label text-[10px] text-frost/60">Holiday style</span>
        <select name="cat" defaultValue="All" className="bg-transparent text-sm outline-none [&>option]:bg-ink">
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "Any style" : c}
            </option>
          ))}
        </select>
      </label>
      <label className={`${cell} md:border-r-0`}>
        <span className="label text-[10px] text-frost/60">Departing</span>
        <select name="month" defaultValue="" className="bg-transparent text-sm outline-none [&>option]:bg-ink">
          <option value="">Any month</option>
          {departureMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </select>
      </label>
      <Magnetic strength={0.2} className="block">
        <button className="w-full rounded-full bg-glow px-7 py-4 text-sm font-semibold text-ink transition-colors hover:bg-ice">Find tours ↗</button>
      </Magnetic>
    </form>
  );
}
