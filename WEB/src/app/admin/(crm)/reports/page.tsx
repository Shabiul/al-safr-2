import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { report, SERVICE_LABEL, type Booking } from "@/lib/ops";
import { card, Loading, money, PageHead } from "../../ui";

export default function ReportsPage() {
  return (
    <>
      <PageHead title="Reports" sub="Revenue and conversion, computed from real bookings, payments and leads." />
      <Suspense fallback={<Loading />}>
        <Report />
      </Suspense>
    </>
  );
}

async function Report() {
  await requireSuperAdmin();
  const { totals: t, byService, byMonth, promos } = await report();
  const stats = [
    { label: "Net received", value: money(t.net), hint: "payments minus refunds" },
    { label: "Confirmed revenue", value: money(t.confirmed), hint: "confirmed + completed bookings" },
    { label: "Bookings", value: String(t.bookings), hint: "all statuses" },
    { label: "Lead win rate", value: t.closed ? `${Math.round((t.won / t.closed) * 100)}%` : "—", hint: `${t.won} booked of ${t.leads} leads` },
  ];
  const maxS = Math.max(1, ...byService.map((s) => s.revenue));
  const maxM = Math.max(1, ...byMonth.map((m) => Math.abs(m.received)));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={card}>
            <p className="label text-[10px] text-ice/55">{s.label}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-ice/45">{s.hint}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-5 font-semibold">Confirmed revenue by service</h2>
          {byService.length ? (
            <ul className="space-y-3 text-sm">
              {byService.map((s) => (
                <li key={s.serviceType} className="grid grid-cols-[100px_1fr_90px] items-center gap-3">
                  <span className="text-ice/70">{SERVICE_LABEL[s.serviceType as Booking["serviceType"]]}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-ice/8">
                    <span className="block h-full rounded-full bg-glow" style={{ width: `${(s.revenue / maxS) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{money(s.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ice/50">No confirmed bookings yet.</p>
          )}
        </section>
        <section className={card}>
          <h2 className="mb-5 font-semibold">Received per month (last 12)</h2>
          {byMonth.length ? (
            <div className="flex h-40 items-end gap-2">
              {byMonth.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1" title={`${m.month}: ${money(m.received)}`}>
                  <div className="w-full rounded-t-md bg-[#1fa77a]" style={{ height: `${Math.max(2, (Math.abs(m.received) / maxM) * 128)}px` }} />
                  <span className="text-[10px] text-ice/50">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ice/50">No payments recorded yet.</p>
          )}
        </section>
      </div>
      <section className={card}>
        <h2 className="mb-4 font-semibold">Promo code usage</h2>
        {promos.length ? (
          <ul className="divide-y divide-ice/8 text-sm">
            {promos.map((p) => (
              <li key={p.promoCode} className="flex justify-between py-2">
                <span className="font-mono font-semibold">{p.promoCode}</span>
                <span className="text-ice/55">{p.n} bookings</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ice/50">No bookings have used a promo code yet.</p>
        )}
      </section>
    </div>
  );
}
