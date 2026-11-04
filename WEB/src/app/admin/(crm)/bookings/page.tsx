import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { BOOKING_STATUSES, listBookings, SERVICE_LABEL } from "@/lib/ops";
import { btn, card, day, ghost, input, Loading, money, PageHead } from "../../ui";
import { BookingBadge } from "./badge";

export default function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  return (
    <>
      <PageHead title="Bookings" sub="Confirmed trips and services, with payments and documents.">
        <Link href="/admin/bookings/new" className={btn}>
          + New booking
        </Link>
      </PageHead>
      <Suspense fallback={<Loading />}>
        <Table searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Table({ searchParams }: Pick<PageProps<"/admin/bookings">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim().toLowerCase();
  const status = String(sp.status ?? "");
  const all = await listBookings();
  const rows = all.filter((b) => (!status || b.status === status) && (!q || [b.customerName, b.customerEmail ?? "", b.customerPhone ?? "", b.packageSlug ?? ""].some((v) => v.toLowerCase().includes(q))));
  const due = all.filter((b) => b.status !== "cancelled").reduce((s, b) => s + Math.max(0, b.amount - b.paid), 0);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap gap-2">
          <input name="q" defaultValue={q} placeholder="Search customer or package" className={`${input} max-w-xs`} />
          <select name="status" defaultValue={status} className={`${input} !w-auto capitalize`}>
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className={ghost}>Filter</button>
        </form>
        <p className="text-sm text-ice/60">
          Outstanding across open bookings: <span className="font-semibold text-ice">{money(due)}</span>
        </p>
      </div>
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="label text-[10px] text-ice/50">
            <tr className="border-b border-ice/10">
              {["Customer", "Service", "Travel date", "Amount", "Paid", "Status", "Created"].map((h) => (
                <th key={h} className="px-5 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-ice/5 last:border-0 hover:bg-ice/[.03]">
                <td className="px-5 py-3">
                  <Link href={`/admin/bookings/${b.id}`} className="font-medium hover:text-glow">
                    {b.customerName}
                  </Link>
                  <p className="text-xs text-ice/50">{b.customerEmail ?? b.customerPhone ?? "—"}</p>
                </td>
                <td className="px-5 py-3 text-ice/75">{SERVICE_LABEL[b.serviceType]}</td>
                <td className="px-5 py-3 text-ice/75">{b.travelDate ? day(b.travelDate) : "—"}</td>
                <td className="px-5 py-3 tabular-nums">{money(b.amount)}</td>
                <td className={`px-5 py-3 tabular-nums ${b.paid >= b.amount ? "text-[#1fa77a]" : ""}`}>{money(b.paid)}</td>
                <td className="px-5 py-3">
                  <BookingBadge status={b.status} />
                </td>
                <td className="px-5 py-3 text-ice/55">{day(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-8 text-center text-sm text-ice/50">No bookings yet. Create one from a lead or with “New booking”.</p>}
      </div>
    </>
  );
}
