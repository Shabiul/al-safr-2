"use server";

import { createLead } from "@/lib/crm";
import { getContent } from "@/lib/content";
import { promoScope, promoValid, type PromoUse } from "@/data/updates";

/** wa = pre-written WhatsApp message the visitor can send to the team right after submitting */
export type EnquiryState = { ok: boolean; error?: string; wa?: string };

const waText = (id: string, lines: (string | false | undefined)[]) =>
  ["Hi Al-Safar, I just sent an enquiry on your website.", ...lines.filter(Boolean), `Ref: ${id.slice(0, 8)}`].join("\n");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (f: FormData, k: string, max: number) =>
  String(f.get(k) ?? "")
    .trim()
    .slice(0, max);

/** the visitor's coupon, checked against the CRM's promo codes; returns the note line for the lead, or an error */
async function coupon(f: FormData, use: PromoUse): Promise<{ line?: string; error?: string; data?: { code: string; discount: string; usedOn: string } }> {
  const c = text(f, "coupon", 30).toUpperCase();
  if (!c) return {};
  const { promos, packages } = await getContent();
  const p = promos.find((x) => x.code.toUpperCase() === c);
  // a switched-off code answers exactly like an unknown one
  if (!p || p.active === false) return { error: "That coupon code isn't valid. Check it, or leave the box empty." };
  if (p.endsAt && new Date(p.endsAt).getTime() < Date.now()) return { error: "That coupon code has expired. Leave the box empty to send without it." };
  if (!promoValid(p, use)) return { error: `That coupon code can't be used here. ${promoScope(p, (s) => packages.find((x) => x.slug === s)?.title)}.` };
  return { line: `Coupon: ${p.code} (${p.off || p.title})`, data: { code: p.code.toUpperCase(), discount: p.off || p.title, usedOn: "service" in use ? use.service : "Package" } };
}

const PHONE = /^[0-9 ()-]{6,18}$/;
const CODE = /^\+\d{1,4}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** public: the Flights / Hotels / Buses / Trains forms in "Book it yourself"; the request lands in the CRM as a lead with every field in the notes */
export async function sendBooking(_: EnquiryState, f: FormData): Promise<EnquiryState> {
  if (text(f, "website", 200)) return { ok: true };
  const kind = text(f, "kind", 10);
  if (kind !== "dummy" && kind !== "rail" && kind !== "hotel" && kind !== "bus")
    return { ok: false, error: "Something went wrong. Please reload and try again." };
  const code = text(f, "code", 6);
  const phone = text(f, "phone", 20);
  if (!CODE.test(code) || !PHONE.test(phone)) return { ok: false, error: "Please enter a valid mobile number." };
  const from = text(f, "from", 80);
  const to = text(f, "to", 80);
  const missing = kind === "dummy" || kind === "bus" ? !from || !to : kind === "hotel" ? !to : !from && !to && !text(f, "country", 80);
  if (missing)
    return {
      ok: false,
      error:
        kind === "hotel"
          ? "Please tell us where you want to stay."
          : kind === "rail"
            ? "Please add where you want to travel."
            : "Please add where you are travelling from and to.",
    };
  const date = text(f, "date", 10);
  if (!DATE.test(date)) return { ok: false, error: "Please choose a departure date." };
  const back = text(f, "return", 10);
  if (kind === "hotel" && !back) return { ok: false, error: "Please choose a check-out date." };
  if (back && (!DATE.test(back) || back < date)) return { ok: false, error: "The return date must be after the departure date." };
  const adults = Math.min(20, Math.max(1, Math.round(Number(f.get("adults"))) || 1));
  const others = Math.min(20, Math.max(0, Math.round(Number(f.get("seniors"))) || 0)) + Math.min(20, Math.max(0, Math.round(Number(f.get("children"))) || 0));
  const rows: [string, string][] =
    kind === "hotel"
      ? [
          ["Stay in", to],
          ["Check-in", date],
          ["Check-out", back],
          ["Hotel class", text(f, "class", 30)],
        ]
      : kind === "bus"
        ? [
            ["From", from],
            ["To", to],
            ["Travel date", date],
          ]
        : kind === "dummy"
          ? [
              ["Trip", text(f, "trip", 20)],
              ["From", from],
              ["To", to],
              ["Departure", date],
              ["Return", back],
              ["Class", text(f, "class", 30)],
            ]
          : [
              ["Rail product", text(f, "product", 40)],
              ["Country", text(f, "country", 80)],
              ["From", from],
              ["To", to],
              ["Date", `${date} ${text(f, "time", 5)}`.trim()],
              ["Nationality", text(f, "nationality", 40)],
            ];
  const cp = await coupon(f, { service: ({ dummy: "Flights", rail: "Trains", hotel: "Hotels", bus: "Buses" } as const)[kind] });
  if (cp.error) return { ok: false, error: cp.error };
  const lead = await createLead({
    name: { dummy: "Flight / dummy ticket request", rail: "Rail request", hotel: "Hotel request", bus: "Bus request" }[kind],
    email: "",
    phone: `${code} ${phone}`,
    source: ({ dummy: "Dummy ticket form", rail: "Rail form", hotel: "Hotel form", bus: "Bus form" } as const)[kind],
    packageSlug: null,
    departure: date,
    travellers: Math.min(50, adults + others),
    notes: [...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), ...(cp.line ? [cp.line] : [])].join("\n"),
    coupon: cp.data,
  });
  const label = { dummy: "Flights", rail: "Trains", hotel: "Hotels", bus: "Buses" }[kind];
  return { ok: true, wa: waText(lead.id, [`Service: ${label}`, ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)]) };
}

/** public: the package page's enquiry form posts here and the lead lands in the CRM */
export async function sendEnquiry(_: EnquiryState, f: FormData): Promise<EnquiryState> {
  // bots fill the hidden "website" field; pretend it worked
  if (text(f, "website", 200)) return { ok: true };
  const name = text(f, "name", 100);
  const email = text(f, "email", 200).toLowerCase();
  const travellers = Math.round(Number(f.get("travellers")));
  if (!name) return { ok: false, error: "Please add your name." };
  if (!EMAIL.test(email)) return { ok: false, error: "That email doesn't look right." };
  if (!(travellers >= 1 && travellers <= 20)) return { ok: false, error: "Travellers must be between 1 and 20." };
  const slug = text(f, "package", 120);
  const pkg = (await getContent()).packages.find((x) => x.slug === slug);
  const cp = await coupon(f, { pkg: { slug, category: pkg?.category ?? "" } });
  if (cp.error) return { ok: false, error: cp.error };
  // ponytail: no rate limiting; put the site behind a WAF or add a per-IP limit if spam shows up
  const lead = await createLead({
    name,
    email,
    phone: text(f, "phone", 40),
    source: "Website enquiry",
    packageSlug: text(f, "package", 120) || null,
    departure: text(f, "date", 40) || "Flexible",
    travellers,
    notes: [text(f, "notes", 2000), cp.line].filter(Boolean).join("\n"),
    coupon: cp.data,
  });
  return { ok: true, wa: waText(lead.id, [`Name: ${name}`, pkg && `Package: ${pkg.title}, ${pkg.country}`, `Date: ${text(f, "date", 40) || "Flexible"}`, `Travellers: ${travellers}`]) };
}
