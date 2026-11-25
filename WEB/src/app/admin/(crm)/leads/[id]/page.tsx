import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getLead, STAGE_LABEL, STAGES } from "@/lib/crm";
import { addNote, removeLead, saveLead, setStage } from "../../../actions";
import { btn, card, ghost, input, Loading, money, StageBadge, when } from "../../../ui";

export default function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Lead params={params} />
    </Suspense>
  );
}

async function Lead({ params }: Pick<PageProps<"/admin/leads/[id]">, "params">) {
  await requireAdmin();
  const lead = await getLead((await params).id);
  if (!lead) notFound();
  const id = lead.id;

  return (
    <>
      <Link href="/admin/leads" className="text-sm text-ice/55 hover:text-ice">
        ← All leads
      </Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{lead.name}</h1>
        <StageBadge stage={lead.stage} />
        <span className="text-sm text-ice/50">
          {lead.source} · {when(lead.createdAt)}
        </span>
        {lead.coupons.map((c) => (
          <span key={c} className="rounded-full bg-sand/15 px-3 py-1 font-mono text-xs text-sand">
            Coupon {c}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-4 font-semibold">Stage</h2>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <form key={s} action={setStage.bind(null, id, s)}>
                  <button aria-pressed={lead.stage === s} className={lead.stage === s ? btn : ghost}>
                    {STAGE_LABEL[s]}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-4 font-semibold">Details</h2>
            <form action={saveLead.bind(null, id)} className="grid gap-4 sm:grid-cols-2">
              <L label="Name">
                <input name="name" defaultValue={lead.name} required className={input} />
              </L>
              <L label="Email">
                <input name="email" type="email" defaultValue={lead.email} required className={input} />
              </L>
              <L label="Phone / WhatsApp">
                <input name="phone" defaultValue={lead.phone} className={input} />
              </L>
              <L label="Departure">
                <input name="departure" defaultValue={lead.departure} className={input} />
              </L>
              <L label="Travellers">
                <input name="travellers" type="number" min={1} max={50} defaultValue={lead.travellers} className={input} />
              </L>
              <L label="Value (USD)">
                <input name="value" type="number" min={0} defaultValue={lead.value} className={input} />
              </L>
              <div className="sm:col-span-2">
                <button className={btn}>Save details</button>
              </div>
            </form>
          </section>

          <section className={card}>
            <h2 className="mb-4 font-semibold">Activity</h2>
            <form action={addNote.bind(null, id)} className="mb-5 flex gap-2">
              <input name="note" required placeholder="Log a call, email or note…" className={input} />
              <button className={btn}>Add</button>
            </form>
            <ol className="relative space-y-4 border-l border-ice/10 pl-5">
              {lead.activity.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-glow ring-4 ring-night" />
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-ice/45">
                    {when(a.at)}
                    {a.staffName && ` · ${a.staffName}`}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className={card}>
            <h2 className="mb-4 font-semibold">Trip</h2>
            <dl className="space-y-3 text-sm">
              <Row k="Package" v={lead.packageSlug ? <Link href={`/packages/${lead.packageSlug}`} className="text-glow hover:underline">{lead.packageTitle}</Link> : "General enquiry"} />
              <Row k="Departure" v={lead.departure} />
              <Row k="Travellers" v={lead.travellers} />
              <Row k="Value" v={money(lead.value)} />
            </dl>
            {lead.notes && <p className="mt-4 rounded-2xl bg-ink p-4 text-sm text-ice/75">“{lead.notes}”</p>}
          </section>

          <section className={`${card} flex flex-col gap-2`}>
            <Link href={`/admin/bookings/new?lead=${id}`} className={btn}>
              Create booking
            </Link>
            <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your Al-Safar enquiry${lead.packageTitle ? `: ${lead.packageTitle}` : ""}`)}`} className={ghost}>
              ✉ Email {lead.name.split(" ")[0]}
            </a>
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className={ghost}>
                WhatsApp
              </a>
            )}
            <form action={removeLead.bind(null, id)}>
              <button className="mt-2 w-full text-sm text-ice/45 hover:text-sand">Delete lead</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-ice/60">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ice/50">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
