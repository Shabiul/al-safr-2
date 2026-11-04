import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listLeads, type Lead } from "@/lib/crm";
import { card, day, Loading, money, PageHead } from "../../ui";

export default function CustomersPage() {
  return (
    <>
      <PageHead title="Customers" sub="Everyone who has enquired, grouped by email." />
      <Suspense fallback={<Loading />}>
        <Customers />
      </Suspense>
    </>
  );
}

async function Customers() {
  await requireAdmin();
  // customers are derived from leads, so there is nothing extra to keep in sync
  const groups = new Map<string, Lead[]>();
  for (const l of await listLeads()) groups.set(l.email, [...(groups.get(l.email) ?? []), l]);
  const rows = [...groups.values()].map((ls) => {
    const booked = ls.filter((l) => l.stage === "booked");
    return { latest: ls[0], count: ls.length, trips: booked.length, spent: booked.reduce((s, l) => s + l.value, 0) };
  });

  return (
    <div className={`${card} overflow-x-auto p-0`}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="label text-[10px] text-ice/50">
          <tr className="border-b border-ice/10">
            <th className="px-5 py-3 font-normal">Customer</th>
            <th className="px-5 py-3 font-normal">Enquiries</th>
            <th className="px-5 py-3 font-normal">Booked trips</th>
            <th className="px-5 py-3 font-normal">Lifetime value</th>
            <th className="px-5 py-3 font-normal">Last enquiry</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ latest, count, trips, spent }) => (
            <tr key={latest.email} className="border-b border-ice/5 last:border-0 hover:bg-ice/[.03]">
              <td className="px-5 py-3">
                <Link href={`/admin/leads?q=${encodeURIComponent(latest.email)}`} className="font-medium hover:text-glow">
                  {latest.name}
                </Link>
                <p className="text-xs text-ice/50">
                  {latest.email}
                  {latest.phone && ` · ${latest.phone}`}
                </p>
              </td>
              <td className="px-5 py-3 tabular-nums">{count}</td>
              <td className="px-5 py-3 tabular-nums">{trips}</td>
              <td className="px-5 py-3 tabular-nums">{money(spent)}</td>
              <td className="px-5 py-3 text-ice/55">{day(latest.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="p-8 text-center text-sm text-ice/50">No customers yet.</p>}
    </div>
  );
}
