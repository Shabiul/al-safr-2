"use server";

import { createLead } from "@/lib/crm";

export type EnquiryState = { ok: boolean; error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

const PHONE = /^[0-9 ()-]{6,18}$/;
const CODE = /^\+\d{1,4}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** public: the Dummy ticket / Rail forms in "Book it yourself"; the request lands in the CRM as a lead with every field in the notes */
export async function sendBooking(_: EnquiryState, f: FormData): Promise<EnquiryState> {
  if (text(f, "website", 200)) return { ok: true };
  const kind = text(f, "kind", 10);
  if (kind !== "dummy" && kind !== "rail") return { ok: false, error: "Something went wrong. Please reload and try again." };
  const code = text(f, "code", 6);
  const phone = text(f, "phone", 20);
  if (!CODE.test(code) || !PHONE.test(phone)) return { ok: false, error: "Please enter a valid mobile number." };
  const from = text(f, "from", 80);
  const to = text(f, "to", 80);
  if (kind === "dummy" ? !from || !to : !from && !to && !text(f, "country", 80)) return { ok: false, error: kind === "dummy" ? "Please add where you are flying from and to." : "Please add where you want to travel." };
  const date = text(f, "date", 10);
  if (!DATE.test(date)) return { ok: false, error: "Please choose a departure date." };
  const back = text(f, "return", 10);
  if (back && (!DATE.test(back) || back < date)) return { ok: false, error: "The return date must be after the departure date." };
  const adults = Math.min(20, Math.max(1, Math.round(Number(f.get("adults"))) || 1));
  const others = Math.min(20, Math.max(0, Math.round(Number(f.get("seniors"))) || 0)) + Math.min(20, Math.max(0, Math.round(Number(f.get("children"))) || 0));
  const rows: [string, string][] =
    kind === "dummy"
      ? [["Trip", text(f, "trip", 20)], ["From", from], ["To", to], ["Departure", date], ["Return", back], ["Class", text(f, "class", 30)]]
      : [["Rail product", text(f, "product", 40)], ["Country", text(f, "country", 80)], ["From", from], ["To", to], ["Date", `${date} ${text(f, "time", 5)}`.trim()], ["Nationality", text(f, "nationality", 40)]];
  await createLead({
    name: kind === "dummy" ? "Dummy ticket request" : "Rail request",
    email: "",
    phone: `${code} ${phone}`,
    source: kind === "dummy" ? "Dummy ticket form" : "Rail form",
    packageSlug: null,
    departure: date,
    travellers: Math.min(50, adults + others),
    notes: rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n"),
  });
  return { ok: true };
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
  // ponytail: no rate limiting; put the site behind a WAF or add a per-IP limit if spam shows up
  await createLead({
    name,
    email,
    phone: text(f, "phone", 40),
    source: "Website enquiry",
    packageSlug: text(f, "package", 120) || null,
    departure: text(f, "date", 40) || "Flexible",
    travellers,
    notes: text(f, "notes", 2000),
  });
  return { ok: true };
}
