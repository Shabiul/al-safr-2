"use server";

import { createLead } from "@/lib/crm";

export type EnquiryState = { ok: boolean; error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

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
