// Server-only: bookings, payments, documents, suppliers, markup and staff (alsafr schema).
import { sql } from "./db";
import { UUID } from "./crm";
import type { Role } from "./admin-auth";

export const SERVICES = ["package", "flights", "hotels", "cabs", "visa", "other"] as const;
export const SERVICE_LABEL: Record<(typeof SERVICES)[number], string> = { package: "Tour package", flights: "Flights", hotels: "Hotels", cabs: "Cabs", visa: "Visa", other: "Other" };
export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export const PAYMENT_METHODS = ["Card", "Bank transfer", "Cash", "Payment link", "Other"] as const;
export const DOC_TYPES = ["Passport", "Visa", "Ticket", "Hotel voucher", "Invoice", "Other"] as const;
export const MARKUP_SERVICES = ["packages", "flights", "hotels", "cabs"] as const;

export type Booking = {
  id: string;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceType: (typeof SERVICES)[number];
  packageSlug: string | null;
  details: string | null;
  travelDate: string | null;
  amount: number;
  currency: string;
  promoCode: string | null;
  status: (typeof BOOKING_STATUSES)[number];
  notes: string | null;
  assignedTo: string | null;
  /** payments minus refunds */
  paid: number;
};
export type Payment = { id: string; createdAt: string; type: "payment" | "refund"; method: string; amount: number; reference: string | null; note: string | null; recordedBy: string | null };
export type Doc = { id: string; createdAt: string; type: string; fileName: string; storagePath: string; uploadedBy: string | null };
export type Supplier = { id: string; createdAt: string; name: string; type: string; contactName: string | null; phone: string | null; email: string | null; commissionPercent: number | null; notes: string | null; active: boolean };
export type StaffRow = { id: string; email: string; name: string; role: Role; active: boolean; createdAt: string };

const bookingCols = sql`b.*, b.travel_date::text as travel_date,
  coalesce((select sum(case when p.type = 'payment' then p.amount else -p.amount end) from alsafr.payments p where p.booking_id = b.id), 0)::float8 as paid`;

export const listBookings = async () => [...(await sql<Booking[]>`select ${bookingCols} from alsafr.bookings b order by b.created_at desc`)];

export async function getBooking(id: string) {
  if (!UUID.test(id)) return null;
  const [b] = await sql<Booking[]>`select ${bookingCols} from alsafr.bookings b where b.id = ${id}`;
  if (!b) return null;
  const [payments, documents] = await Promise.all([
    sql<Payment[]>`select * from alsafr.payments where booking_id = ${id} order by created_at desc`,
    sql<Doc[]>`select * from alsafr.documents where booking_id = ${id} order by created_at desc`,
  ]);
  return { ...b, payments: [...payments], documents: [...documents] };
}

export type BookingInput = Omit<Booking, "id" | "createdAt" | "updatedAt" | "status" | "paid">;

export async function createBooking(input: BookingInput) {
  const [b] = await sql<{ id: string }[]>`insert into alsafr.bookings ${sql(input)} returning id`;
  return b.id;
}

export async function updateBooking(id: string, patch: Partial<Pick<Booking, "status" | "notes" | "amount" | "travelDate">>) {
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  if (UUID.test(id) && keys.length) await sql`update alsafr.bookings set ${sql(patch, keys)}, updated_at = now() where id = ${id}`;
}

export const addPayment = (bookingId: string, p: Omit<Payment, "id" | "createdAt">) => sql`insert into alsafr.payments ${sql({ bookingId, ...p })}`;

export const addDocument = (bookingId: string, d: Omit<Doc, "id" | "createdAt">) => sql`insert into alsafr.documents ${sql({ bookingId, ...d })}`;

export async function deleteDocument(id: string) {
  if (!UUID.test(id)) return null;
  const [d] = await sql<Doc[]>`delete from alsafr.documents where id = ${id} returning *`;
  return d ?? null;
}

export async function getDocument(id: string) {
  if (!UUID.test(id)) return null;
  const [d] = await sql<(Doc & { bookingId: string })[]>`select * from alsafr.documents where id = ${id}`;
  return d ?? null;
}

export const listSuppliers = async () => [...(await sql<Supplier[]>`select * from alsafr.suppliers order by active desc, name`)];
export const createSupplier = (s: Omit<Supplier, "id" | "createdAt" | "active">) => sql`insert into alsafr.suppliers ${sql(s)}`;
export const setSupplierActive = (id: string, active: boolean) => (UUID.test(id) ? sql`update alsafr.suppliers set active = ${active} where id = ${id}` : null);

export async function getMarkup() {
  const rows = await sql<{ service: string; percentage: number }[]>`select service, percentage from alsafr.markup`;
  const by = new Map(rows.map((r) => [r.service, r.percentage]));
  return MARKUP_SERVICES.map((service) => ({ service, percentage: by.get(service) ?? 0 }));
}

export const setMarkup = (service: string, percentage: number) =>
  sql`insert into alsafr.markup (service, percentage) values (${service}, ${percentage})
      on conflict (service) do update set percentage = excluded.percentage, updated_at = now()`;

export const listStaff = async () => [...(await sql<StaffRow[]>`select id, email, name, role, active, created_at from alsafr.staff order by created_at`)];
export const createStaff = (s: { email: string; name: string; role: Role; passwordHash: string }) => sql`insert into alsafr.staff ${sql(s)}`;
export const updateStaff = (id: string, patch: Partial<{ active: boolean; role: Role; passwordHash: string }>) => {
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  return UUID.test(id) && keys.length ? sql`update alsafr.staff set ${sql(patch, keys)} where id = ${id}` : null;
};

export async function report() {
  const [[totals], byService, byMonth, promos] = await Promise.all([
    sql<{ net: number; bookings: number; confirmed: number; leads: number; won: number; closed: number }[]>`
      select
        coalesce((select sum(case when type = 'payment' then amount else -amount end) from alsafr.payments), 0)::float8 as net,
        (select count(*) from alsafr.bookings)::int as bookings,
        coalesce((select sum(amount) from alsafr.bookings where status in ('confirmed', 'completed')), 0)::float8 as confirmed,
        (select count(*) from alsafr.leads)::int as leads,
        (select count(*) from alsafr.leads where stage = 'booked')::int as won,
        (select count(*) from alsafr.leads where stage in ('booked', 'lost'))::int as closed`,
    sql<{ serviceType: string; revenue: number; n: number }[]>`
      select service_type, sum(amount)::float8 as revenue, count(*)::int as n from alsafr.bookings
      where status in ('confirmed', 'completed') group by 1 order by 2 desc`,
    sql<{ month: string; received: number }[]>`
      select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
        sum(case when type = 'payment' then amount else -amount end)::float8 as received
      from alsafr.payments where created_at > now() - interval '12 months' group by 1 order by 1`,
    sql<{ promoCode: string; n: number }[]>`
      select upper(promo_code) as promo_code, count(*)::int as n from alsafr.bookings where coalesce(promo_code, '') <> '' group by 1 order by 2 desc`,
  ]);
  return { totals, byService: [...byService], byMonth: [...byMonth], promos: [...promos] };
}
