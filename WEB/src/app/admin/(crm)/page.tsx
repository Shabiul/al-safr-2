import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listLeads, STAGE_LABEL, STAGES, type Lead } from "@/lib/crm";
import { card, day, Loading, money, PageHead, StageBadge } from "../ui";

export default function DashboardPage() {
  return (
    <>
      <PageHead title="Dashboard" sub="Enquiries, pipeline and bookings at a glance." />
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

// request-time read (this component is dynamic anyway); kept out of render for the purity lint
const newerThan = (leads: Lead[], days: number) => {
  const since = Date.now() - days * 864e5;
  return leads.filter((l) => Date.parse(l.createdAt) > since);
};

async function Dashboard() {
  await requireAdmin();
  const leads = await listLeads();
  const open = leads.filter((l) => !["booked", "lost"].includes(l.stage));
  const booked = leads.filter((l) => l.stage === "booked");
  const closed = booked.length + leads.filter((l) => l.stage === "lost").length;
  const fresh = newerThan(leads, 7).length;

  const stats = [
    { label: "Open leads", value: String(open.length), hint: `${fresh} new this week` },
    { label: "Pipeline value", value: money(open.reduce((s, l) => s + l.value, 0)), hint: "new + contacted + quoted" },
    { label: "Booked revenue", value: money(booked.reduce((s, l) => s + l.value, 0)), hint: `${booked.length} bookings` },
    { label: "Win rate", value: closed ? `${Math.round((booked.length / closed) * 100)}%` : "—", hint: "booked ÷ (booked + lost)" },
  ];

  const byStage = STAGES.map((s) => ({ s, n: leads.filter((l) => l.stage === s).length }));
  const max = Math.max(1, ...byStage.map((b) => b.n));

  const top = Object.values(
    leads.reduce<Record<string, { title: string; n: number; value: number }>>((acc, l) => {
      if (!l.packageTitle) return acc;
      const t = (acc[l.packageTitle] ??= { title: l.packageTitle, n: 0, value: 0 });
      t.n++;
      t.value += l.value;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

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
          <h2 className="mb-5 font-semibold">Leads by stage</h2>
          <ul className="space-y-3">
            {byStage.map(({ s, n }) => (
              <li key={s} className="grid grid-cols-[90px_1fr_32px] items-center gap-3 text-sm">
                <span className="text-ice/70">{STAGE_LABEL[s]}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-ice/8">
                  <span className="block h-full rounded-full bg-glow" style={{ width: `${(n / max) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="mb-5 font-semibold">Most requested packages</h2>
          {top.length ? (
            <ol className="space-y-3 text-sm">
              {top.map((t, i) => (
                <li key={t.title} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="mr-2 text-ice/40">{i + 1}.</span>
                    {t.title}
                  </span>
                  <span className="shrink-0 text-ice/55 tabular-nums">
                    {t.n} · {money(t.value)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ice/50">No package enquiries yet.</p>
          )}
        </section>
      </div>

      <section className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Latest enquiries</h2>
          <Link href="/admin/leads" className="text-sm text-glow hover:underline">
            All leads →
          </Link>
        </div>
        <ul className="divide-y divide-ice/8">
          {leads.slice(0, 6).map((l) => (
            <li key={l.id}>
              <Link href={`/admin/leads/${l.id}`} className="flex items-center gap-4 py-3 hover:text-glow">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-glow/12 text-sm font-semibold text-glow">{l.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{l.name}</span>
                  <span className="block truncate text-xs text-ice/50">{l.packageTitle ?? "General enquiry"}</span>
                </span>
                <span className="hidden text-xs text-ice/45 sm:block">{day(l.createdAt)}</span>
                <StageBadge stage={l.stage} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
