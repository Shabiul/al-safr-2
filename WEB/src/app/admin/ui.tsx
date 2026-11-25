import { STAGE_LABEL, type Stage } from "@/lib/crm-shared";

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

const TONE: Record<Stage, string> = {
  new: "bg-glow/15 text-glow",
  contacted: "bg-sand/15 text-sand",
  quoted: "bg-[#8a63e0]/15 text-[#8a63e0]",
  booked: "bg-[#1fa77a]/15 text-[#1fa77a]",
  lost: "bg-ice/10 text-ice/50",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={`label inline-block rounded-full px-2.5 py-1 text-[9px] ${TONE[stage]}`}>{STAGE_LABEL[stage]}</span>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ice/55">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export const card = "rounded-3xl border border-ice/10 bg-night p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,.5)]";
export const input = "w-full rounded-xl border border-ice/15 bg-ink px-3.5 py-2.5 text-sm text-ice outline-none placeholder:text-ice/35 focus:border-glow";
export const btn = "inline-flex items-center justify-center gap-2 rounded-full bg-ice px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-glow";
export const ghost = "inline-flex items-center justify-center gap-2 rounded-full border border-ice/20 px-5 py-2.5 text-sm transition-colors hover:border-glow";

export const Loading = () => <div className="h-64 animate-pulse rounded-3xl bg-ice/5" />;
