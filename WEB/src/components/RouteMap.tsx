"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import routes from "@/data/routes.json";
import type { Package } from "@/data/packages";

type Mode = "drive" | "fly" | "sea";
type Leg = { mode: Mode; km: number; coords: [number, number][] };

// OpenFreeMap: free OpenStreetMap vector tiles, no key needed
// the worker is served from public/maplibre (copied on postinstall) because the bundler cannot emit it
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const COLORS: Record<Mode, string> = { drive: "#0e8fb3", fly: "#c97a2b", sea: "#2f7fd1" };
const ICON: Record<Mode, string> = { drive: "🚐", fly: "✈", sea: "⛴" };
const LABEL: Record<Mode, string> = { drive: "Road & rail", fly: "Flight", sea: "Boat & ferry" };

// marching-ants frames for the dashed flight and ferry lines
const DASH = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

const bearing = (a: [number, number], b: [number, number]) => (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;

export default function RouteMap({ p }: { p: Package }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const vehicle = useRef<maplibregl.Marker | null>(null);
  const pins = useRef<HTMLElement[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [touring, setTouring] = useState(false);

  const legs = useMemo(() => ((routes as unknown as Record<string, Leg[]>)[p.slug] ?? []), [p.slug]);

  // one pin per distinct place, remembering every stop number that lands there
  const places = useMemo(() => {
    const out: { place: string; coords: [number, number]; nights: number; stay: string; nums: number[] }[] = [];
    p.route.forEach((s, i) => {
      const hit = out.find((o) => o.place === s.place);
      if (hit) {
        hit.nums.push(i + 1);
        hit.nights += s.nights;
      } else out.push({ place: s.place, coords: [s.coords[1], s.coords[0]], nights: s.nights, stay: s.stay, nums: [i + 1] });
    });
    return out;
  }, [p.route]);

  const totals = useMemo(() => {
    const t: Partial<Record<Mode, number>> = {};
    legs.forEach((l) => (t[l.mode] = (t[l.mode] ?? 0) + l.km));
    return t;
  }, [legs]);

  useEffect(() => {
    const bounds = new maplibregl.LngLatBounds();
    places.forEach((pl) => bounds.extend(pl.coords));
    legs.forEach((l) => l.coords.forEach((c) => bounds.extend(c)));

    const m = new maplibregl.Map({
      container: box.current!,
      style: STYLE,
      bounds,
      fitBoundsOptions: { padding: { top: 70, bottom: 120, left: 60, right: 70 }, maxZoom: 9 },
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    let raf = 0;
    let dashTimer = 0;
    let io: IntersectionObserver | null = null;

    m.on("load", () => {
      const empty = { type: "FeatureCollection" as const, features: [] as GeoJSON.Feature[] };
      m.addSource("route", { type: "geojson", data: empty });
      m.addLayer({ id: "drive-casing", type: "line", source: "route", filter: ["==", ["get", "mode"], "drive"], paint: { "line-color": "#ffffff", "line-width": 8 }, layout: { "line-cap": "round", "line-join": "round" } });
      m.addLayer({ id: "drive", type: "line", source: "route", filter: ["==", ["get", "mode"], "drive"], paint: { "line-color": COLORS.drive, "line-width": 4 }, layout: { "line-cap": "round", "line-join": "round" } });
      for (const mode of ["fly", "sea"] as const)
        m.addLayer({ id: mode, type: "line", source: "route", filter: ["==", ["get", "mode"], mode], paint: { "line-color": COLORS[mode], "line-width": 3, "line-dasharray": DASH[0] }, layout: { "line-cap": "round" } });

      // pins pop in as the line reaches them
      pins.current = places.map((pl, i) => {
        const el = document.createElement("div");
        el.className = "route-pin";
        el.innerHTML = `<span class="route-pin-num">${pl.nums.join("·")}</span><span class="route-pin-label">${pl.place}${pl.nights ? ` · ${pl.nights}N` : ""}</span>`;
        el.onclick = () => focusStop(i);
        new maplibregl.Marker({ element: el, anchor: "left", offset: [-14, 0] }).setLngLat(pl.coords).addTo(m);
        return el;
      });

      const total = legs.reduce((n, l) => n + l.coords.length, 0);
      const draw = (t: number) => {
        let budget = Math.floor(total * t);
        const features: GeoJSON.Feature[] = [];
        let reached = 1;
        for (const l of legs) {
          if (budget <= 1) break;
          const n = Math.min(l.coords.length, budget);
          features.push({ type: "Feature", properties: { mode: l.mode }, geometry: { type: "LineString", coordinates: l.coords.slice(0, n) } });
          budget -= n;
          if (n === l.coords.length) reached++;
        }
        (m.getSource("route") as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features });
        pins.current.forEach((el, i) => el.classList.toggle("is-in", legs.length === 0 || i < reached || t >= 1));
      };
      draw(0);

      // draw the route once the map scrolls into view
      io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io?.disconnect();
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / 2600);
          draw(1 - Math.pow(1 - t, 3));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, { threshold: 0.4 });
      io.observe(box.current!);

      let frame = 0;
      dashTimer = window.setInterval(() => {
        frame = (frame + 1) % DASH.length;
        for (const mode of ["fly", "sea"]) if (m.getLayer(mode)) m.setPaintProperty(mode, "line-dasharray", DASH[frame]);
      }, 60);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(dashTimer);
      io?.disconnect();
      m.remove();
      map.current = null;
    };
    // focusStop only reads refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legs, places]);

  function focusStop(i: number) {
    setActive(i);
    pins.current.forEach((el, j) => el.classList.toggle("is-active", j === i));
    map.current?.flyTo({ center: places[i].coords, zoom: 10, speed: 1.2, essential: true });
  }

  function overview() {
    const b = new maplibregl.LngLatBounds();
    places.forEach((pl) => b.extend(pl.coords));
    legs.forEach((l) => l.coords.forEach((c) => b.extend(c)));
    map.current?.fitBounds(b, { padding: { top: 70, bottom: 120, left: 60, right: 70 }, maxZoom: 9, duration: 1400 });
  }

  /** fly a vehicle along every leg, camera following, highlighting each stop on arrival */
  function tour() {
    const m = map.current;
    if (!m || touring || !legs.length) return;
    setTouring(true);
    const el = document.createElement("div");
    el.className = "route-vehicle";
    vehicle.current?.remove();
    vehicle.current = new maplibregl.Marker({ element: el }).setLngLat(legs[0].coords[0]).addTo(m);

    let leg = 0;
    const runLeg = () => {
      if (leg >= legs.length) {
        vehicle.current?.remove();
        vehicle.current = null;
        setTouring(false);
        setActive(null);
        pins.current.forEach((p) => p.classList.remove("is-active"));
        overview();
        return;
      }
      const l = legs[leg];
      el.textContent = ICON[l.mode];
      const dur = Math.min(5200, 1600 + l.km * 6);
      const t0 = performance.now();
      m.easeTo({ center: l.coords[0], zoom: l.km > 300 ? 6 : 8, duration: 700 });
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const f = e * (l.coords.length - 1);
        const k = Math.floor(f);
        const a = l.coords[k];
        const b = l.coords[Math.min(k + 1, l.coords.length - 1)];
        const pos: [number, number] = [a[0] + (b[0] - a[0]) * (f - k), a[1] + (b[1] - a[1]) * (f - k)];
        vehicle.current?.setLngLat(pos);
        if (l.mode === "fly") el.style.setProperty("--rot", `${bearing(a, b) - 90}deg`);
        else el.style.setProperty("--rot", "0deg");
        m.jumpTo({ center: pos });
        if (t < 1) requestAnimationFrame(step);
        else {
          const arrived = places.findIndex((pl) => Math.abs(pl.coords[0] - l.coords[l.coords.length - 1][0]) < 0.05 && Math.abs(pl.coords[1] - l.coords[l.coords.length - 1][1]) < 0.05);
          if (arrived >= 0) {
            setActive(arrived);
            pins.current.forEach((p, j) => p.classList.toggle("is-active", j === arrived));
          }
          leg++;
          setTimeout(runLeg, 650);
        }
      };
      setTimeout(() => requestAnimationFrame(step), 700);
    };
    setActive(0);
    pins.current.forEach((p, j) => p.classList.toggle("is-active", j === 0));
    runLeg();
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-ice/10">
        <div ref={box} className="h-[380px] w-full md:h-[460px]" aria-label={`Map of the route: ${p.route.map((s) => s.place).join(", ")}`} />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          {(Object.keys(totals) as Mode[]).map((mode) => (
            <span key={mode} className="frost-glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
              <span className="inline-block h-0.5 w-5" style={{ background: COLORS[mode] }} />
              {LABEL[mode]} · {totals[mode]?.toLocaleString("en-US")} km
            </span>
          ))}
        </div>
        <div className="absolute bottom-8 left-3 flex gap-2">
          {legs.length > 0 && (
            <button onClick={tour} disabled={touring} className="label rounded-full bg-ice px-4 py-2.5 text-[11px] text-ink shadow-lg transition-colors hover:bg-glow disabled:opacity-60">
              {touring ? "Touring…" : "▶ Map tour"}
            </button>
          )}
          <button onClick={overview} className="label frost-glass rounded-full px-4 py-2.5 text-[11px]">
            Whole route
          </button>
        </div>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {places.map((pl, i) => (
          <li key={pl.place}>
            <button
              onClick={() => focusStop(i)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-300 ${
                active === i ? "border-glow bg-glow/10 shadow-[0_8px_30px_-12px_rgba(14,143,179,.6)]" : "border-ice/10 hover:border-glow/50"
              }`}
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${active === i ? "bg-sand text-white" : "bg-glow text-white"}`}>
                {pl.nums[0]}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{pl.place}</span>
                <span className="block truncate text-xs text-ice/55">
                  {pl.nights ? `${pl.nights} ${pl.nights === 1 ? "night" : "nights"} · ${pl.stay}` : pl.stay}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
