import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listLeads, STAGE_LABEL, STAGES } from "@/lib/crm";
import { btn, card, day, ghost, input, Loading, money, PageHead, StageBadge } from "../../ui";

export default function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <>
      <PageHead title="Leads" sub="Every enquiry from the website, plus leads your team adds.">
        <Link href="/admin/leads/new" className={btn}>
          + Add lead
        </Link>
      </PageHead>
      <Suspense fallback={<Loading />}>
        <Table searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Table({ searchParams }: Pick<PageProps<"/admin/leads">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim().toLowerCase();
  const stage = String(sp.stage ?? "");
  const leads = (await listLeads()).filter(
    (l) => (!stage || l.stage === stage) && (!q || [l.name, l.email, l.phone, l.packageTitle ?? ""].some((v) => v.toLowerCase().includes(q))),
  );

  return (
    <>
      {/* plain GET form: filters live in the URL, so they can be bookmarked and shared */}
      <form className="mb-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone or package" className={`${input} max-w-sm`} />
        <select name="stage" defaultValue={stage} className={`${input} !w-auto`}>
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <button className={ghost}>Filter</button>
        {(q || stage) && (
          <Link href="/admin/leads" className="self-center text-sm text-ice/55 hover:text-ice">
            Clear
          </Link>
        )}
      </form>

      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="label text-[10px] text-ice/50">
            <tr className="border-b border-ice/10">
              <th className="px-5 py-3 font-normal">Name</th>
              <th className="px-5 py-3 font-normal">Package</th>
              <th className="px-5 py-3 font-normal">Travellers</th>
              <th className="px-5 py-3 font-normal">Value</th>
              <th className="px-5 py-3 font-normal">Stage</th>
              <th className="px-5 py-3 font-normal">Received</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-ice/5 last:border-0 hover:bg-ice/[.03]">
                <td className="px-5 py-3">
                  <Link href={`/admin/leads/${l.id}`} className="font-medium hover:text-glow">
                    {l.name}
                  </Link>
                  <p className="text-xs text-ice/50">{l.email}</p>
                </td>
                <td className="max-w-56 truncate px-5 py-3 text-ice/75">{l.packageTitle ?? "—"}</td>
                <td className="px-5 py-3 tabular-nums">{l.travellers}</td>
                <td className="px-5 py-3 tabular-nums">{money(l.value)}</td>
                <td className="px-5 py-3">
                  <StageBadge stage={l.stage} />
                </td>
                <td className="px-5 py-3 text-ice/55">{day(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leads.length && <p className="p-8 text-center text-sm text-ice/50">No leads match.</p>}
      </div>
    </>
  );
}
