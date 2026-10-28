// Builds src/data/routes.json: real road geometry (OSRM) between consecutive stops, arcs for flights and boats.
// Re-run after changing package routes:  npx --yes tsx scripts/build-routes.mts
import { writeFileSync } from "node:fs";
import { packages } from "../src/data/packages";

type Mode = "drive" | "fly" | "sea";
type Leg = { mode: Mode; km: number; coords: [number, number][] };

// how you arrive at stop i, where the itinerary says flight or boat rather than road
const VIA: Record<string, (Mode | "")[]> = {
  "thailand-islands-trio": ["", "fly", "sea"],
  "malaysia-kl-penang-langkawi": ["", "fly", "fly", "fly"],
  "nepal-kathmandu-pokhara": ["", "fly", "fly"],
  "bali-and-gili-islands": ["", "sea", "sea"],
  "andaman-island-hop": ["", "sea", "sea", "sea"],
  "vietnam-north-to-south": ["", "", "fly", "", "fly"],
  "amalfi-to-paris-grand-tour": ["", "", "", "", "fly"],
  "kenya-great-migration": ["", "fly"],
  "maldives-beach-and-water-villas": ["", "sea"],
  "singapore-city-and-cruise": ["", "sea"],
  "bali-temples-and-rice": ["", ""],
};

const rad = (d: number) => (d * Math.PI) / 180;
const km = ([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) => {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

/** gentle quadratic arc between two points, bowed to the left of travel */
function arc(a: [number, number], b: [number, number], bow = 0.18, n = 48): [number, number][] {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const c: [number, number] = [(a[0] + b[0]) / 2 - dy * bow, (a[1] + b[1]) / 2 + dx * bow];
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  });
}

const round = (c: [number, number][]) => c.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)] as [number, number]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function drive(a: [number, number], b: [number, number]) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=simplified&geometries=geojson`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "al-safr-route-builder" } });
      const j = await res.json();
      if (j.code !== "Ok") return null;
      const r = j.routes[0];
      return { km: r.distance / 1000, hours: r.duration / 3600, coords: r.geometry.coordinates as [number, number][] };
    } catch {
      await sleep(2000);
    }
  }
  return null;
}

const out: Record<string, Leg[]> = {};
for (const p of packages) {
  const legs: Leg[] = [];
  const stops = p.route.map((s) => [s.coords[1], s.coords[0]] as [number, number]);
  for (let i = 1; i < stops.length; i++) {
    const [a, b] = [stops[i - 1], stops[i]];
    const straight = km(a, b);
    if (straight < 0.5) continue;
    let mode = VIA[p.slug]?.[i] || "";
    if (!mode) {
      const r = await drive(a, b);
      await sleep(1100); // be gentle with the public demo server
      if (r && r.hours <= 9 && r.km <= straight * 3) {
        legs.push({ mode: "drive", km: Math.round(r.km), coords: round(r.coords) });
        continue;
      }
      mode = straight > 150 ? "fly" : "sea";
    }
    legs.push({ mode: mode as Mode, km: Math.round(straight), coords: round(arc(a, b, mode === "fly" ? 0.2 : 0.12)) });
  }
  out[p.slug] = legs;
  console.log(p.slug, legs.map((l) => `${l.mode}:${l.km}km`).join(" "));
}

writeFileSync(new URL("../src/data/routes.json", import.meta.url), JSON.stringify(out));
console.log("wrote", Object.keys(out).length, "packages");
