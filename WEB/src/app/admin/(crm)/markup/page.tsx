import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getMarkup } from "@/lib/ops";
import { saveMarkup } from "../../ops-actions";
import { btn, card, input, Loading, PageHead } from "../../ui";

export default function MarkupPage() {
  return (
    <>
      <PageHead title="Markup" sub="Percentage added on top of supplier cost when the team quotes. Super admins only." />
      <Suspense fallback={<Loading />}>
        <Markup />
      </Suspense>
    </>
  );
}

async function Markup() {
  await requireSuperAdmin();
  const rows = await getMarkup();
  return (
    <form action={saveMarkup} className={`${card} max-w-md space-y-4 p-6`}>
      {rows.map((r) => (
        <label key={r.service} className="flex items-center justify-between gap-4">
          <span className="capitalize">{r.service}</span>
          <span className="flex items-center gap-2">
            <input name={r.service} type="number" min={0} max={500} step="0.1" defaultValue={r.percentage} className={`${input} !w-28 text-right`} />%
          </span>
        </label>
      ))}
      <p className="text-xs text-ice/50">Example: a $1,000 hotel cost at 12% markup is quoted at $1,120.</p>
      <button className={btn}>Save markup</button>
    </form>
  );
}
