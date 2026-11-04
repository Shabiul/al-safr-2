import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { readContent } from "@/lib/content";
import { getLead } from "@/lib/crm";
import { SERVICE_LABEL, SERVICES } from "@/lib/ops";
import { addBooking } from "../../../ops-actions";
import { btn, card, input, Loading, PageHead } from "../../../ui";

export default function NewBookingPage({ searchParams }: PageProps<"/admin/bookings/new">) {
  return (
    <>
      <PageHead title="New booking" sub="Opened from a lead, the customer and package are filled in for you." />
      <Suspense fallback={<Loading />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/admin/bookings/new">, "searchParams">) {
  await requireAdmin();
  const leadId = String((await searchParams).lead ?? "");
  const [lead, { packages }] = await Promise.all([leadId ? getLead(leadId) : null, readContent()]);
  return (
    <form action={addBooking} className={`${card} grid max-w-3xl gap-4 p-6 sm:grid-cols-2`}>
      {lead && <input type="hidden" name="leadId" value={lead.id} />}
      <F label="Customer name *">
        <input name="customerName" required defaultValue={lead?.name} className={input} />
      </F>
      <F label="Email">
        <input name="customerEmail" type="email" defaultValue={lead?.email} className={input} />
      </F>
      <F label="Phone / WhatsApp">
        <input name="customerPhone" defaultValue={lead?.phone} className={input} />
      </F>
      <F label="Service *">
        <select name="serviceType" defaultValue="package" className={input}>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_LABEL[s]}
            </option>
          ))}
        </select>
      </F>
      <F label="Package" wide>
        <select name="packageSlug" defaultValue={lead?.packageSlug ?? ""} className={input}>
          <option value="">— none —</option>
          {packages.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}, {p.country}
            </option>
          ))}
        </select>
      </F>
      <F label="Travel date">
        <input name="travelDate" type="date" className={input} />
      </F>
      <F label="Promo code">
        <input name="promoCode" className={`${input} uppercase`} />
      </F>
      <F label="Amount *">
        <input name="amount" type="number" min={0} step="0.01" required defaultValue={lead?.value || undefined} className={input} />
      </F>
      <F label="Currency">
        <input name="currency" defaultValue="USD" maxLength={3} className={`${input} uppercase`} />
      </F>
      <F label="Details (flights, hotels, travellers…)" wide>
        <textarea name="details" rows={3} defaultValue={lead ? `${lead.travellers} traveller(s), departure ${lead.departure}` : ""} className={input} />
      </F>
      <F label="Internal notes" wide>
        <textarea name="notes" rows={2} className={input} />
      </F>
      <div className="sm:col-span-2">
        <button className={btn}>Create booking</button>
      </div>
    </form>
  );
}

function F({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs text-ice/60">{label}</span>
      {children}
    </label>
  );
}
