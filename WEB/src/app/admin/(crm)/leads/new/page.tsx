import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { readContent } from "@/lib/content";
import { addLead } from "../../../actions";
import { btn, card, input, Loading, PageHead } from "../../../ui";

export default function NewLeadPage() {
  return (
    <>
      <PageHead title="Add lead" sub="For enquiries that came in by phone, WhatsApp or walk-in." />
      <Suspense fallback={<Loading />}>
        <Form />
      </Suspense>
    </>
  );
}

async function Form() {
  await requireAdmin();
  const { packages } = await readContent();
  return (
    <form action={addLead} className={`${card} grid max-w-2xl gap-4 p-6 sm:grid-cols-2`}>
      <Field label="Full name *">
        <input name="name" required className={input} />
      </Field>
      <Field label="Email *">
        <input name="email" type="email" required className={input} />
      </Field>
      <Field label="Phone / WhatsApp">
        <input name="phone" type="tel" className={input} />
      </Field>
      <Field label="Package">
        <select name="package" className={input}>
          <option value="">General enquiry</option>
          {packages.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}, {p.country}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Departure">
        <input name="departure" placeholder="e.g. 12 Dec 2026 or Flexible" className={input} />
      </Field>
      <Field label="Travellers">
        <input name="travellers" type="number" min={1} max={50} defaultValue={2} className={input} />
      </Field>
      <Field label="Value (USD) — leave empty to use package price">
        <input name="value" type="number" min={0} className={input} />
      </Field>
      <Field label="Notes" wide>
        <textarea name="notes" rows={3} className={input} />
      </Field>
      <div className="sm:col-span-2">
        <button className={btn}>Create lead</button>
      </div>
    </form>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs text-ice/60">{label}</span>
      {children}
    </label>
  );
}
