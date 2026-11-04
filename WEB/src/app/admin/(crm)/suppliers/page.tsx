import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { listSuppliers } from "@/lib/ops";
import { addSupplier, toggleSupplier } from "../../ops-actions";
import { btn, card, input, Loading, PageHead } from "../../ui";

const TYPES = ["Hotel", "Airline", "Ground transport", "DMC / local operator", "Activities", "Visa agent", "Insurance", "Other"];

export default function SuppliersPage() {
  return (
    <>
      <PageHead title="Suppliers" sub="Hotels, airlines, transport and local partners you book through." />
      <Suspense fallback={<Loading />}>
        <Suppliers />
      </Suspense>
    </>
  );
}

async function Suppliers() {
  await requireAdmin();
  const suppliers = await listSuppliers();
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="label text-[10px] text-ice/50">
            <tr className="border-b border-ice/10">
              {["Supplier", "Type", "Contact", "Commission", ""].map((h) => (
                <th key={h} className="px-5 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className={`border-b border-ice/5 last:border-0 ${s.active ? "" : "opacity-50"}`}>
                <td className="px-5 py-3">
                  <p className="font-medium">{s.name}</p>
                  {s.notes && <p className="max-w-64 truncate text-xs text-ice/50">{s.notes}</p>}
                </td>
                <td className="px-5 py-3 text-ice/75">{s.type}</td>
                <td className="px-5 py-3 text-ice/75">
                  {s.contactName ?? "—"}
                  <p className="text-xs text-ice/50">{[s.phone, s.email].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="px-5 py-3 tabular-nums">{s.commissionPercent == null ? "—" : `${s.commissionPercent}%`}</td>
                <td className="px-5 py-3 text-right">
                  <form action={toggleSupplier.bind(null, s.id, !s.active)}>
                    <button className="text-xs text-ice/55 hover:text-glow">{s.active ? "Deactivate" : "Reactivate"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!suppliers.length && <p className="p-8 text-center text-sm text-ice/50">No suppliers yet.</p>}
      </div>

      <form action={addSupplier} className={`${card} h-fit space-y-3`}>
        <h2 className="font-semibold">Add supplier</h2>
        <input name="name" required placeholder="Name *" className={input} />
        <select name="type" required className={input}>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input name="contactName" placeholder="Contact person" className={input} />
        <input name="phone" placeholder="Phone" className={input} />
        <input name="email" type="email" placeholder="Email" className={input} />
        <input name="commissionPercent" type="number" min={0} max={100} step="0.1" placeholder="Commission %" className={input} />
        <textarea name="notes" rows={2} placeholder="Notes" className={input} />
        <button className={btn}>Add supplier</button>
      </form>
    </div>
  );
}
