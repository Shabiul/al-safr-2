"use client";

import { startTransition, useOptimistic, useState } from "react";
import Link from "next/link";
import { STAGE_LABEL, STAGES, type Lead, type Stage } from "@/lib/crm-shared";
import { setStage } from "../../actions";
import { money } from "../../ui";

export default function Board({ leads }: { leads: Lead[] }) {
  const [shown, move] = useOptimistic(leads, (all, { id, stage }: { id: string; stage: Stage }) => all.map((l) => (l.id === id ? { ...l, stage } : l)));
  const [over, setOver] = useState<Stage | null>(null);

  const drop = (id: string, stage: Stage) =>
    startTransition(async () => {
      move({ id, stage });
      await setStage(id, stage);
    });

  return (
    <div className="grid gap-4 overflow-x-auto pb-4 md:grid-cols-5">
      {STAGES.map((stage) => {
        const col = shown.filter((l) => l.stage === stage);
        return (
          <section
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(stage);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              setOver(null);
              drop(e.dataTransfer.getData("text/plain"), stage);
            }}
            className={`min-h-48 min-w-56 rounded-3xl border p-3 transition-colors ${over === stage ? "border-glow bg-glow/5" : "border-ice/10 bg-night/60"}`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-semibold">{STAGE_LABEL[stage]}</p>
              <p className="text-xs tabular-nums text-ice/50">
                {col.length} · {money(col.reduce((s, l) => s + l.value, 0))}
              </p>
            </header>
            <ul className="space-y-2">
              {col.map((l) => (
                <li
                  key={l.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                  className="cursor-grab rounded-2xl border border-ice/10 bg-night p-3 shadow-sm active:cursor-grabbing"
                >
                  <Link href={`/admin/leads/${l.id}`} className="block text-sm font-medium hover:text-glow" draggable={false}>
                    {l.name}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-ice/55">{l.packageTitle ?? "General enquiry"}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="tabular-nums">{money(l.value)}</span>
                    {/* keyboard / touch alternative to dragging */}
                    <select aria-label={`Move ${l.name}`} value={l.stage} onChange={(e) => drop(l.id, e.target.value as Stage)} className="rounded-lg bg-transparent text-ice/55 outline-none">
                      {STAGES.map((s) => (
                        <option key={s} value={s} className="bg-night">
                          {STAGE_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
