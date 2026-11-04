import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { BOOKING_STATUSES, DOC_TYPES, getBooking, PAYMENT_METHODS, SERVICE_LABEL } from "@/lib/ops";
import { recordPayment, removeBookingDocument, saveBooking, setBookingStatus, uploadBookingDocument } from "../../../ops-actions";
import { btn, card, day, ghost, input, Loading, money, when } from "../../../ui";
import { BookingBadge } from "../badge";

export default function BookingPage({ params }: PageProps<"/admin/bookings/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Booking params={params} />
    </Suspense>
  );
}

async function Booking({ params }: Pick<PageProps<"/admin/bookings/[id]">, "params">) {
  await requireAdmin();
  const b = await getBooking((await params).id);
  if (!b) notFound();
  const due = b.amount - b.paid;

  return (
    <>
      <Link href="/admin/bookings" className="text-sm text-ice/55 hover:text-ice">
        ← All bookings
      </Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{b.customerName}</h1>
        <BookingBadge status={b.status} />
        <span className="text-sm text-ice/50">
          {SERVICE_LABEL[b.serviceType]} · created {when(b.createdAt)} by {b.assignedTo ?? "—"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-4 font-semibold">Status</h2>
            <div className="flex flex-wrap gap-2">
              {BOOKING_STATUSES.map((s) => (
                <form key={s} action={setBookingStatus.bind(null, b.id, s)}>
                  <button aria-pressed={b.status === s} className={`${b.status === s ? btn : ghost} capitalize`}>
                    {s}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className={card}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-semibold">Payments</h2>
              <p className="text-sm">
                Paid <span className="font-semibold tabular-nums">{money(b.paid)}</span> of {money(b.amount)} ·{" "}
                <span className={due > 0 ? "text-sand" : "text-[#1fa77a]"}>{due > 0 ? `${money(due)} due` : "fully paid"}</span>
              </p>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-ice/8">
              <div className="h-full rounded-full bg-[#1fa77a]" style={{ width: `${Math.min(100, (b.paid / Math.max(1, b.amount)) * 100)}%` }} />
            </div>
            <form action={recordPayment.bind(null, b.id)} className="mb-5 grid gap-2 sm:grid-cols-[110px_1fr_1fr_1fr_auto]">
              <select name="type" className={input}>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
              </select>
              <input name="amount" type="number" min={0.01} step="0.01" required placeholder="Amount" className={input} />
              <select name="method" className={input}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <input name="reference" placeholder="Reference / receipt no." className={input} />
              <button className={btn}>Record</button>
            </form>
            <ul className="divide-y divide-ice/8 text-sm">
              {b.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-2.5">
                  <span>
                    <span className={p.type === "refund" ? "text-sand" : ""}>{p.type === "refund" ? "Refund" : "Payment"}</span> · {p.method}
                    {p.reference && <span className="text-ice/50"> · {p.reference}</span>}
                    <span className="block text-xs text-ice/45">
                      {when(p.createdAt)} · {p.recordedBy}
                    </span>
                  </span>
                  <span className={`tabular-nums ${p.type === "refund" ? "text-sand" : ""}`}>
                    {p.type === "refund" ? "−" : ""}
                    {money(p.amount)}
                  </span>
                </li>
              ))}
              {!b.payments.length && <li className="py-2 text-ice/50">No payments recorded yet.</li>}
            </ul>
          </section>

          <section className={card}>
            <h2 className="mb-4 font-semibold">Documents</h2>
            <form action={uploadBookingDocument.bind(null, b.id)} className="mb-5 flex flex-wrap gap-2">
              <select name="type" className={`${input} !w-auto`}>
                {DOC_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <input name="file" type="file" required className={`${input} flex-1 py-2 file:mr-3 file:rounded-full file:border-0 file:bg-ice/10 file:px-3 file:py-1 file:text-ice`} />
              <button className={btn}>Upload</button>
            </form>
            <ul className="divide-y divide-ice/8 text-sm">
              {b.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="min-w-0">
                    {/* signed 5-minute link, created on click */}
                    <a href={`/admin/documents/${d.id}`} target="_blank" rel="noreferrer" className="truncate font-medium hover:text-glow">
                      {d.fileName}
                    </a>
                    <span className="block text-xs text-ice/45">
                      {d.type} · {when(d.createdAt)} · {d.uploadedBy}
                    </span>
                  </span>
                  <form action={removeBookingDocument.bind(null, d.id)}>
                    <button className="text-xs text-ice/45 hover:text-sand">Delete</button>
                  </form>
                </li>
              ))}
              {!b.documents.length && <li className="py-2 text-ice/50">No documents yet — passports, tickets, vouchers and invoices go here.</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className={card}>
            <h2 className="mb-4 font-semibold">Booking</h2>
            <dl className="mb-5 space-y-3 text-sm">
              <Row k="Email" v={b.customerEmail ? <a href={`mailto:${b.customerEmail}`} className="text-glow hover:underline">{b.customerEmail}</a> : "—"} />
              <Row k="Phone" v={b.customerPhone ?? "—"} />
              <Row k="Package" v={b.packageSlug ? <Link href={`/packages/${b.packageSlug}`} className="text-glow hover:underline">{b.packageSlug}</Link> : "—"} />
              <Row k="Promo code" v={b.promoCode ?? "—"} />
              <Row k="Lead" v={b.leadId ? <Link href={`/admin/leads/${b.leadId}`} className="text-glow hover:underline">Open lead</Link> : "—"} />
            </dl>
            {b.details && <p className="mb-5 whitespace-pre-line rounded-2xl bg-ink p-4 text-sm text-ice/75">{b.details}</p>}
            <form action={saveBooking.bind(null, b.id)} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-ice/60">Amount ({b.currency})</span>
                <input name="amount" type="number" min={0} step="0.01" defaultValue={b.amount} className={input} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-ice/60">Travel date {b.travelDate && `(${day(b.travelDate)})`}</span>
                <input name="travelDate" type="date" defaultValue={b.travelDate ?? ""} className={input} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-ice/60">Internal notes</span>
                <textarea name="notes" rows={3} defaultValue={b.notes ?? ""} className={input} />
              </label>
              <button className={btn}>Save</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ice/50">{k}</dt>
      <dd className="truncate text-right">{v}</dd>
    </div>
  );
}
