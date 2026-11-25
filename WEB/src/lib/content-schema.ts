// Field lists for every editable collection. The CRM renders its forms from these, and the save
// action converts + validates with the same lists, so the two can't drift apart. Client-safe.
import type { Content } from "./content-shared";
import { PROMO_SCOPES } from "@/data/updates";

export type FieldType = "text" | "textarea" | "number" | "date" | "datetime" | "bool" | "select" | "image" | "images" | "lines" | "itinerary" | "route" | "coords" | "packages" | "url" | "checks";
export type Field = { key: string; label: string; type: FieldType; options?: readonly string[]; hint?: string; required?: boolean; optional?: boolean; /** bool only: value when nothing is stored yet */ defaultOn?: boolean };
/** what the form holds: plain strings for text-like fields, arrays for image lists / package picks */
export type Draft = Record<string, string | boolean | string[]>;

export type CollectionKey = keyof Content;
export const COLLECTIONS: { key: CollectionKey; title: string; sub: string; single?: boolean; titleKey: string; fields: Field[] }[] = [
  {
    key: "packages",
    title: "Tour packages",
    sub: "Every tour on the site: text, prices, photos, day plans, routes and departure dates.",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "URL slug", type: "text", required: true, hint: "lower-case-with-dashes; the page lives at /packages/<slug>" },
      { key: "place", label: "Places line", type: "text", hint: "e.g. Munnar · Alleppey · Kovalam" },
      { key: "country", label: "Country", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: ["Beach", "Mountains", "City", "Adventure", "Culture"] },
      { key: "tourStyle", label: "Tour style", type: "select", options: ["Customized Holiday", "Group Trip", "Guided Tour", "Private Tour", "Self-Drive"] },
      { key: "price", label: "Price per person (USD)", type: "number", required: true },
      { key: "was", label: "Previous price (shows as a deal)", type: "number", optional: true },
      { key: "days", label: "Days", type: "number" },
      { key: "rating", label: "Rating (0–5)", type: "number" },
      { key: "stars", label: "Hotel stars", type: "select", options: ["3", "4", "5"] },
      { key: "mealPlan", label: "Meal plan", type: "select", options: ["Breakfast", "Half board", "Full board", "All meals"] },
      { key: "flights", label: "Flights included", type: "bool" },
      { key: "freeCancellation", label: "Free cancellation", type: "bool" },
      { key: "groupSize", label: "Group size", type: "text" },
      { key: "bestTime", label: "Best time to go", type: "text" },
      { key: "image", label: "Cover photo", type: "image", required: true },
      { key: "gallery", label: "Gallery photos", type: "images" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "highlights", label: "Highlights", type: "lines", hint: "one per line" },
      { key: "inclusions", label: "Inclusions", type: "lines", hint: "one per line" },
      { key: "exclusions", label: "Exclusions", type: "lines", optional: true, hint: "one per line; leave empty for the standard list" },
      { key: "itinerary", label: "Day-by-day plan", type: "itinerary", hint: "one day per line: Title | what happens" },
      { key: "route", label: "Route stops", type: "route", hint: "one stop per line: Place | nights | stay | lat, lon" },
      { key: "coords", label: "Map pin (lat, lon)", type: "coords" },
      { key: "departures", label: "Departure dates", type: "lines", hint: "one per line, YYYY-MM-DD" },
    ],
  },
  {
    key: "alerts",
    title: "Top alert bar",
    sub: "The rotating announcements in the strip above the navbar.",
    titleKey: "text",
    fields: [
      { key: "id", label: "ID", type: "text", required: true },
      { key: "text", label: "Message", type: "text", required: true },
      { key: "tone", label: "Tone", type: "select", options: ["deal", "info", "new"] },
      { key: "cta", label: "Link label", type: "text", optional: true },
      { key: "href", label: "Link", type: "text", optional: true, hint: "e.g. /packages or /#deals" },
    ],
  },
  {
    key: "promos",
    title: "Promo codes",
    sub: "Discount codes shown in the offers section, with their countdowns.",
    titleKey: "code",
    fields: [
      { key: "code", label: "Code", type: "text", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "detail", label: "Who it's for", type: "text" },
      { key: "off", label: "Discount label", type: "text", hint: "e.g. 10% off or $200 off" },
      { key: "endsAt", label: "Ends at (India time)", type: "datetime" },
      { key: "href", label: "Link", type: "text" },
      { key: "active", label: "Code is active (can be used)", type: "bool", defaultOn: true, hint: "off = refused in every form and hidden everywhere" },
      { key: "visible", label: "Show on the website", type: "bool", defaultOn: true, hint: "off = private code: not listed, but still works when a customer types it" },
      { key: "validFor", label: "Valid for", type: "checks", options: PROMO_SCOPES, hint: "tick All (global) for every service and package; otherwise tick services and/or tour categories" },
      { key: "packages", label: "Also valid on these specific packages", type: "packages", hint: "optional; adds single tours on top of the ticks above" },
    ],
  },
  {
    key: "notifications",
    title: "Notifications",
    sub: "Items in the navbar bell.",
    titleKey: "title",
    fields: [
      { key: "id", label: "ID", type: "text", required: true, hint: "change it to make the item unread for everyone again" },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "body", label: "Text", type: "text" },
      { key: "kind", label: "Kind", type: "select", options: ["price", "departure", "event", "news"] },
      { key: "when", label: "Posted at (India time)", type: "datetime" },
      { key: "href", label: "Link", type: "text" },
    ],
  },
  {
    key: "news",
    title: "News",
    sub: "Latest news cards on the home page.",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "tag", label: "Tag", type: "text" },
      { key: "date", label: "Date", type: "date" },
      { key: "body", label: "Text", type: "textarea" },
      { key: "image", label: "Photo", type: "image", required: true },
      { key: "href", label: "Link", type: "text" },
    ],
  },
  {
    key: "events",
    title: "Events",
    sub: "Upcoming events cards on the home page.",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "place", label: "Place", type: "text" },
      { key: "start", label: "Starts", type: "date" },
      { key: "end", label: "Ends", type: "date", optional: true },
      { key: "body", label: "Text", type: "textarea" },
      { key: "image", label: "Photo", type: "image", required: true },
      { key: "href", label: "Link", type: "text" },
    ],
  },
  {
    key: "bookLinks",
    title: "Navbar service menus",
    sub: "Clicking Flights, Hotels, Buses or Trains in the navbar shows two choices: instant booking (redirects to your link) and a request (the on-site form, saved as a lead). Leave the link empty to show only the request.",
    titleKey: "id",
    fields: [
      { key: "id", label: "Service", type: "select", options: ["flights", "hotels", "buses", "trains"], required: true },
      { key: "url", label: "Instant booking link (opens in a new tab)", type: "url", optional: true, hint: "full https:// address, e.g. your affiliate link; empty = no instant option" },
      { key: "instantTitle", label: "Instant booking: title", type: "text" },
      { key: "instantNote", label: "Instant booking: description", type: "text" },
      { key: "requestTitle", label: "Request: title", type: "text" },
      { key: "requestNote", label: "Request: description", type: "text" },
    ],
  },
  {
    key: "forms",
    title: "Booking forms",
    sub: "The Flights, Hotels, Buses and Trains request forms (also linked from the navbar): headings, countries, nationalities and notices.",
    single: true,
    titleKey: "dummyHeadline",
    fields: [
      { key: "bgImage", label: "Section background photo", type: "image", optional: true, hint: "shown behind the whole Book it yourself section; leave empty for none" },
      { key: "dummyEnabled", defaultOn: true, label: "Show the Flights (dummy ticket) form", type: "bool" },
      { key: "hotelEnabled", defaultOn: true, label: "Show the Hotels form", type: "bool" },
      { key: "busEnabled", defaultOn: true, label: "Show the Buses form", type: "bool" },
      { key: "hotelStars", label: "Hotel classes", type: "lines", hint: "one per line" },
      { key: "dummyEyebrow", label: "Small red heading", type: "text" },
      { key: "dummyHeadline", label: "Main heading", type: "text", required: true },
      { key: "dummyPromise", label: "Promise line", type: "text" },
      { key: "dummyTag", label: "Tag line", type: "text" },
      { key: "dummyBlurb", label: "Description", type: "textarea", hint: "one line per paragraph" },
      { key: "dummyClasses", label: "Travel classes", type: "lines", hint: "one per line" },
      { key: "railEnabled", defaultOn: true, label: "Show the Trains (rail) form", type: "bool" },
      { key: "showPromoSection", label: "Show the Discount codes section on the home page", type: "bool", defaultOn: true },
      { key: "showCouponField", label: "Show the coupon / discount code box in the forms", type: "bool", defaultOn: true },
      { key: "railNotice", label: "Nationality notice", type: "textarea", hint: "shown under Nationality or Residency" },
      { key: "railCountries", label: "Global rail: popular countries", type: "lines", hint: "one per line: Country | 2-letter code, e.g. Japan | jp" },
      { key: "railPassCountries", label: "Rail passes: countries to visit", type: "lines", hint: "one per line: Country | 2-letter code" },
      { key: "nationalities", label: "Nationality list", type: "lines", hint: "one per line" },
    ],
  },
  {
    key: "display",
    title: "Theme & display",
    sub: "Light or dark, accent colour, seasonal look and accessibility for the whole website and this CRM. Visitors cannot change it.",
    single: true,
    titleKey: "mode",
    fields: [
      { key: "mode", label: "Appearance", type: "select", options: ["light", "dark", "auto"], hint: "auto follows each visitor's device" },
      { key: "accent", label: "Accent colour", type: "select", options: ["lagoon", "oasis", "ember", "twilight"] },
      { key: "season", label: "Seasonal theme", type: "select", options: ["auto", "off", "lights", "winter", "blossom", "summer"], hint: "auto picks by the date" },
      { key: "large", label: "Larger text", type: "bool" },
      { key: "contrast", label: "High contrast", type: "bool" },
      { key: "reduce", label: "Reduce motion", type: "bool" },
      { key: "underline", label: "Underline links", type: "bool" },
    ],
  },
  {
    key: "settings",
    title: "Homepage",
    sub: "Hero photo, hot-deal countdown and the featured packages grid.",
    single: true,
    titleKey: "heroImage",
    fields: [
      { key: "heroImage", label: "Hero background photo", type: "image", required: true },
      { key: "hotDealEnds", label: "Hot deals end at (India time)", type: "datetime" },
      { key: "whatsapp", label: "WhatsApp number", type: "text", optional: true, hint: "country code + number, digits only, e.g. 919876543210; empty hides every WhatsApp button" },
      { key: "featured", label: "Featured packages", type: "packages", hint: "shown in this order on the home page" },
    ],
  },
];

export const collection = (key: string) => COLLECTIONS.find((c) => c.key === key);

const TZ = "+05:30"; // dates are entered in India time
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const parts = (l: string) => l.split("|").map((x) => x.trim());
const coords = (s: string): [number, number] => {
  const [a, b] = s.split(",").map((x) => Number(x.trim()));
  return [Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0];
};

/** stored value → what the form shows */
export function toDraft(fields: Field[], item: Record<string, unknown>): Draft {
  const d: Draft = {};
  for (const f of fields) {
    const v = item[f.key];
    if (f.type === "bool") d[f.key] = v === undefined || v === null ? !!f.defaultOn : !!v;
    else if (f.type === "images" || f.type === "packages" || f.type === "checks") d[f.key] = (v as string[] | undefined) ?? [];
    else if (f.type === "lines") d[f.key] = ((v as string[] | undefined) ?? []).join("\n");
    else if (f.type === "itinerary") d[f.key] = ((v as { title: string; desc: string }[] | undefined) ?? []).map((x) => `${x.title} | ${x.desc}`).join("\n");
    else if (f.type === "route")
      d[f.key] = ((v as { place: string; nights: number; stay: string; coords: [number, number] }[] | undefined) ?? []).map((s) => `${s.place} | ${s.nights} | ${s.stay} | ${s.coords.join(", ")}`).join("\n");
    else if (f.type === "coords") d[f.key] = ((v as number[] | undefined) ?? []).join(", ");
    else if (f.type === "datetime") d[f.key] = typeof v === "string" ? v.slice(0, 16) : "";
    else d[f.key] = v === undefined || v === null ? "" : String(v);
  }
  return d;
}

const IMAGE_OK = /^https:\/\/([a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/alsafr-media\/[\w.-]+|images\.unsplash\.com\/\S+)$/;

/** form → stored value; throws a readable message when something is invalid */
export function fromDraft(fields: Field[], d: Draft, label: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = d[f.key];
    const s = typeof raw === "string" ? raw.trim() : "";
    const fail = (why: string) => {
      throw new Error(`${label}: ${f.label} ${why}`);
    };
    if (f.required && f.type !== "bool" && (Array.isArray(raw) ? !raw.length : !s)) fail("is required");
    if (f.optional && !s && !Array.isArray(raw) && f.type !== "bool") continue;
    switch (f.type) {
      case "bool":
        out[f.key] = !!raw;
        break;
      case "number": {
        const n = Number(s || 0);
        if (!Number.isFinite(n) || n < 0) fail("must be a positive number");
        out[f.key] = n;
        break;
      }
      case "select":
        if (f.options && !f.options.includes(s)) fail(`must be one of ${f.options.join(", ")}`);
        out[f.key] = f.key === "stars" ? Number(s) : s;
        break;
      case "date":
        if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) fail("must be YYYY-MM-DD");
        out[f.key] = s;
        break;
      case "datetime":
        if (s && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) fail("must be a date and time");
        out[f.key] = s ? `${s}:00${TZ}` : "";
        break;
      case "url":
        try {
          if (new URL(s).protocol !== "https:") throw 0;
        } catch {
          fail("must be a full https:// link");
        }
        out[f.key] = s;
        break;
      case "image":
        if (s && !IMAGE_OK.test(s)) fail("must be an uploaded photo or an images.unsplash.com link");
        out[f.key] = s;
        break;
      case "checks": {
        const picked = (raw as string[]).filter((x) => f.options!.includes(x));
        out[f.key] = picked.includes("All (global)") ? ["All (global)"] : picked;
        break;
      }
      case "images":
      case "packages": {
        const list = (raw as string[]).map((x) => x.trim()).filter(Boolean);
        if (f.type === "images" && list.some((x) => !IMAGE_OK.test(x))) fail("has a photo that isn't uploaded or from images.unsplash.com");
        out[f.key] = list;
        break;
      }
      case "lines": {
        const list = lines(s);
        if (f.key === "departures" && list.some((x) => !/^\d{4}-\d{2}-\d{2}$/.test(x))) fail("must be YYYY-MM-DD, one per line");
        out[f.key] = f.key === "departures" ? list.sort() : list;
        break;
      }
      case "itinerary":
        out[f.key] = lines(s).map((l) => {
          const [title, ...rest] = parts(l);
          return { title, desc: rest.join(" | ") };
        });
        break;
      case "route":
        out[f.key] = lines(s).map((l) => {
          const [place, nights, stay, c = ""] = parts(l);
          if (!place) fail("needs a place on every line");
          return { place, nights: Math.max(0, Math.round(Number(nights) || 0)), stay: stay ?? "", coords: coords(c) };
        });
        break;
      case "coords":
        out[f.key] = coords(s);
        break;
      default:
        out[f.key] = s;
    }
  }
  return out;
}
