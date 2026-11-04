"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, requireAdmin, requireSuperAdmin, type Role } from "@/lib/admin-auth";
import { getLead, updateLead } from "@/lib/crm";
import { readContent } from "@/lib/content";
import { removeDocument, uploadDocument } from "@/lib/storage";
import {
  addDocument,
  addPayment,
  BOOKING_STATUSES,
  createBooking,
  createStaff,
  createSupplier,
  deleteDocument,
  DOC_TYPES,
  MARKUP_SERVICES,
  PAYMENT_METHODS,
  SERVICES,
  setMarkup,
  setSupplierActive,
  updateBooking,
  updateStaff,
  type Booking,
} from "@/lib/ops";

const text = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const orNull = (s: string) => s || null;
const money = (f: FormData, k: string) => {
  const n = Math.round(Number(f.get(k)) * 100) / 100;
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
const done = () => revalidatePath("/admin", "layout");

/* ---------- bookings ---------- */

export async function addBooking(f: FormData) {
  const me = await requireAdmin();
  const customerName = text(f, "customerName", 100);
  const serviceType = text(f, "serviceType") as Booking["serviceType"];
  const amount = money(f, "amount");
  if (!customerName || !SERVICES.includes(serviceType) || Number.isNaN(amount)) return;
  const slug = text(f, "packageSlug", 120);
  const { packages } = await readContent();
  const leadId = text(f, "leadId", 40);
  const lead = leadId ? await getLead(leadId) : null;
  const id = await createBooking({
    leadId: lead?.id ?? null,
    customerName,
    customerEmail: orNull(text(f, "customerEmail").toLowerCase()),
    customerPhone: orNull(text(f, "customerPhone", 40)),
    serviceType,
    packageSlug: packages.some((p) => p.slug === slug) ? slug : null,
    details: orNull(text(f, "details", 2000)),
    travelDate: /^\d{4}-\d{2}-\d{2}$/.test(text(f, "travelDate")) ? text(f, "travelDate") : null,
    amount,
    currency: /^[A-Z]{3}$/.test(text(f, "currency")) ? text(f, "currency") : "USD",
    promoCode: orNull(text(f, "promoCode", 40).toUpperCase()),
    notes: orNull(text(f, "notes", 2000)),
    assignedTo: me.name,
  });
  // a booking made from a lead closes that lead as won
  if (lead && lead.stage !== "booked") await updateLead(lead.id, { stage: "booked" }, "Booking created — stage changed to Booked", me.name);
  done();
  redirect(`/admin/bookings/${id}`);
}

export async function setBookingStatus(id: string, status: Booking["status"]) {
  await requireAdmin();
  if (BOOKING_STATUSES.includes(status)) await updateBooking(id, { status });
  done();
}

export async function saveBooking(id: string, f: FormData) {
  await requireAdmin();
  const amount = money(f, "amount");
  const travelDate = text(f, "travelDate");
  await updateBooking(id, {
    notes: orNull(text(f, "notes", 2000)),
    ...(Number.isNaN(amount) ? {} : { amount }),
    travelDate: /^\d{4}-\d{2}-\d{2}$/.test(travelDate) ? travelDate : null,
  });
  done();
}

export async function recordPayment(bookingId: string, f: FormData) {
  const me = await requireAdmin();
  const amount = money(f, "amount");
  const type = text(f, "type") === "refund" ? "refund" : "payment";
  const method = text(f, "method");
  if (!(amount > 0) || !(PAYMENT_METHODS as readonly string[]).includes(method)) return;
  await addPayment(bookingId, { type, method, amount, reference: orNull(text(f, "reference", 120)), note: orNull(text(f, "note", 500)), recordedBy: me.name });
  done();
}

const DOC_MAX = 15 * 1024 * 1024;

export async function uploadBookingDocument(bookingId: string, f: FormData) {
  const me = await requireAdmin();
  const file = f.get("file");
  const type = text(f, "type");
  if (!(file instanceof File) || !file.size || file.size > DOC_MAX || !(DOC_TYPES as readonly string[]).includes(type)) return;
  // keep the original name for display only; the stored path is ours
  const fileName = file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "document";
  const storagePath = `${bookingId}/${randomUUID()}-${fileName.replace(/\s+/g, "_")}`;
  await uploadDocument(storagePath, Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");
  await addDocument(bookingId, { type, fileName, storagePath, uploadedBy: me.name });
  done();
}

export async function removeBookingDocument(id: string) {
  await requireAdmin();
  const d = await deleteDocument(id);
  if (d) await removeDocument(d.storagePath);
  done();
}

/* ---------- suppliers ---------- */

export async function addSupplier(f: FormData) {
  await requireAdmin();
  const name = text(f, "name", 120);
  const type = text(f, "type", 60);
  if (!name || !type) return;
  const c = Number(f.get("commissionPercent"));
  await createSupplier({
    name,
    type,
    contactName: orNull(text(f, "contactName", 100)),
    phone: orNull(text(f, "phone", 40)),
    email: orNull(text(f, "email").toLowerCase()),
    commissionPercent: text(f, "commissionPercent") && c >= 0 && c <= 100 ? c : null,
    notes: orNull(text(f, "notes", 1000)),
  });
  done();
}

export async function toggleSupplier(id: string, active: boolean) {
  await requireAdmin();
  await setSupplierActive(id, active);
  done();
}

/* ---------- super admin: markup + staff ---------- */

export async function saveMarkup(f: FormData) {
  await requireSuperAdmin();
  for (const s of MARKUP_SERVICES) {
    const n = Number(f.get(s));
    if (Number.isFinite(n) && n >= 0 && n <= 500) await setMarkup(s, n);
  }
  done();
}

export async function addStaff(_: { error?: string; ok?: number }, f: FormData): Promise<{ error?: string; ok?: number }> {
  await requireSuperAdmin();
  const email = text(f, "email").toLowerCase();
  const name = text(f, "name", 100);
  const password = String(f.get("password") ?? "");
  const role: Role = f.get("role") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "STAFF";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) return { error: "Add a name and a valid email." };
  if (password.length < 8) return { error: "Passwords need at least 8 characters." };
  try {
    await createStaff({ email, name, role, passwordHash: await hashPassword(password) });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { error: `${email} already has an account.` };
    throw e;
  }
  done();
  return { ok: Date.now() }; // changes every time, so the form remounts empty
}

export async function setStaffActive(id: string, active: boolean) {
  const me = await requireSuperAdmin();
  if (id === me.id && !active) return; // never lock yourself out
  await updateStaff(id, { active });
  done();
}

export async function resetStaffPassword(id: string, f: FormData) {
  await requireSuperAdmin();
  const password = String(f.get("password") ?? "");
  if (password.length >= 8) await updateStaff(id, { passwordHash: await hashPassword(password) });
  done();
}
