"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { collection, toDraft, type Draft, type Field } from "@/lib/content-schema";
import { saveCollection, uploadImage } from "../../actions";
import { btn, card, ghost, input } from "../../ui";

type Opt = { slug: string; title: string };

/** list + form editor for one content collection; the whole collection is saved in one go */
export default function Editor({ coll, initial, packages }: { coll: string; initial: Record<string, unknown>[]; packages: Opt[] }) {
  const c = collection(coll)!;
  const [items, setItems] = useState<Draft[]>(() => initial.map((it) => toDraft(c.fields, it)));
  const [sel, setSel] = useState(0);
  const [q, setQ] = useState("");
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (next: Draft[]) => {
    setItems(next);
    setDirty(true);
    setMsg(null);
  };
  const set = (key: string, v: Draft[string]) => change(items.map((it, i) => (i === sel ? { ...it, [key]: v } : it)));
  const blank = useMemo(() => toDraft(c.fields, {}), [c.fields]);
  const label = (it: Draft) => `${String(it[c.titleKey] || "Untitled")}${it.enabled === false ? " · off" : ""}`;
  const shown = items.map((it, i) => ({ it, i })).filter(({ it }) => !q || label(it).toLowerCase().includes(q.toLowerCase()));

  const save = () =>
    startSave(async () => {
      const r = await saveCollection(coll, items);
      setMsg(r.ok ? { ok: true, text: "Saved — the website is updated." } : { ok: false, text: r.error ?? "Could not save." });
      if (r.ok) {
        setDirty(false);
        // the look is applied by a script in <head>, so a reload is how this page picks the new theme up
        if (coll === "display") setTimeout(() => location.reload(), 300); // after the unsaved-changes guard has cleared
      }
    });

  const item = items[sel];

  return (
    <div className={`grid gap-6 ${c.single ? "max-w-4xl" : "lg:grid-cols-[280px_1fr]"}`}>
      {!c.single && (
        <aside className={`${card} h-fit p-3 lg:sticky lg:top-6`}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${items.length} items`} className={`${input} mb-2`} />
          <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto">
            {shown.map(({ it, i }) => (
              <li key={i}>
                <button onClick={() => setSel(i)} className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm ${i === sel ? "bg-glow/12 font-semibold text-glow" : "hover:bg-ice/5"}`}>
                  {label(it)}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              change([...items, { ...blank }]);
              setSel(items.length);
            }}
            className={`${ghost} mt-3 w-full`}
          >
            + Add new
          </button>
        </aside>
      )}

      <div className="min-w-0 space-y-4">
        <div className={`${card} sticky top-0 z-10 flex flex-wrap items-center gap-3 py-3`}>
          <button onClick={save} disabled={saving || !dirty} className={`${btn} disabled:opacity-50`}>
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
          {!c.single && item && (
            <>
              <button onClick={() => sel > 0 && (change(swap(items, sel, sel - 1)), setSel(sel - 1))} className={ghost} aria-label="Move up">
                ↑
              </button>
              <button onClick={() => sel < items.length - 1 && (change(swap(items, sel, sel + 1)), setSel(sel + 1))} className={ghost} aria-label="Move down">
                ↓
              </button>
              <button
                onClick={() => {
                  change([...items.slice(0, sel + 1), { ...item, [c.fields[0].key]: `${item[c.fields[0].key]} (copy)`, ...(c.key === "packages" ? { slug: `${item.slug}-copy` } : {}) }, ...items.slice(sel + 1)]);
                  setSel(sel + 1);
                }}
                className={ghost}
              >
                Duplicate
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Delete "${label(item)}"? It disappears from the site when you save.`)) return;
                  change(items.filter((_, i) => i !== sel));
                  setSel(Math.max(0, sel - 1));
                }}
                className="text-sm text-ice/50 hover:text-sand"
              >
                Delete
              </button>
            </>
          )}
          {msg && <p role="status" className={`text-sm ${msg.ok ? "text-[#1fa77a]" : "text-sand"}`}>{msg.text}</p>}
        </div>

        {item ? (
          <div className={`${card} grid gap-5 p-6 md:grid-cols-2`}>
            {c.fields.map((f) => (
              <FieldInput key={`${sel}-${f.key}`} f={f} value={item[f.key]} onChange={(v) => set(f.key, v)} packages={packages} />
            ))}
          </div>
        ) : (
          <p className={`${card} text-sm text-ice/55`}>Nothing here yet — add the first one.</p>
        )}
      </div>
    </div>
  );
}

const swap = <T,>(a: T[], i: number, j: number) => {
  const b = [...a];
  [b[i], b[j]] = [b[j], b[i]];
  return b;
};

const WIDE = new Set(["textarea", "lines", "itinerary", "route", "images", "packages", "image"]);

function FieldInput({ f, value, onChange, packages }: { f: Field; value: Draft[string]; onChange: (v: Draft[string]) => void; packages: Opt[] }) {
  const s = typeof value === "string" ? value : "";
  const arr = Array.isArray(value) ? value : [];
  let control: React.ReactNode;
  switch (f.type) {
    case "bool":
      control = (
        <button type="button" role="switch" aria-checked={!!value} onClick={() => onChange(!value)} className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${value ? "bg-glow" : "bg-ice/20"}`}>
          <span className={`size-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
        </button>
      );
      break;
    case "select":
      control = (
        <select value={s} onChange={(e) => onChange(e.target.value)} className={input}>
          {!s && <option value="">Choose…</option>}
          {f.options!.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
      break;
    case "textarea":
    case "lines":
    case "itinerary":
    case "route":
      control = <textarea value={s} onChange={(e) => onChange(e.target.value)} rows={f.type === "textarea" ? 4 : Math.min(10, Math.max(3, s.split("\n").length + 1))} className={`${input} font-[inherit] leading-relaxed`} />;
      break;
    case "image":
      control = <ImageInput value={s} onChange={onChange} />;
      break;
    case "images":
      control = (
        <div className="grid gap-3 sm:grid-cols-2">
          {arr.map((u, i) => (
            <div key={i} className="relative">
              <ImageInput value={u} onChange={(v) => onChange(arr.map((x, j) => (j === i ? (v as string) : x)))} />
              <button type="button" onClick={() => onChange(arr.filter((_, j) => j !== i))} className="absolute right-2 top-2 rounded-full bg-night/90 px-2 text-xs shadow hover:text-sand" aria-label="Remove photo">
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange([...arr, ""])} className={`${ghost} min-h-24`}>
            + Add photo
          </button>
        </div>
      );
      break;
    case "packages":
      control = (
        <div className="space-y-2">
          <ol className="space-y-1">
            {arr.map((slug, i) => (
              <li key={slug} className="flex items-center gap-2 rounded-xl border border-ice/10 px-3 py-2 text-sm">
                <span className="w-5 text-ice/40">{i + 1}.</span>
                <span className="flex-1 truncate">{packages.find((p) => p.slug === slug)?.title ?? `${slug} (missing)`}</span>
                <button type="button" onClick={() => i > 0 && onChange(swap(arr, i, i - 1))} aria-label="Move up" className="px-1 text-ice/50 hover:text-ice">
                  ↑
                </button>
                <button type="button" onClick={() => i < arr.length - 1 && onChange(swap(arr, i, i + 1))} aria-label="Move down" className="px-1 text-ice/50 hover:text-ice">
                  ↓
                </button>
                <button type="button" onClick={() => onChange(arr.filter((x) => x !== slug))} aria-label="Remove" className="px-1 text-ice/50 hover:text-sand">
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <select value="" onChange={(e) => e.target.value && onChange([...arr, e.target.value])} className={input}>
            <option value="">+ Add a package…</option>
            {packages
              .filter((p) => !arr.includes(p.slug))
              .map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
          </select>
        </div>
      );
      break;
    default:
      control = (
        <input
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : "text"}
          step={f.type === "number" ? "any" : undefined}
          value={s}
          onChange={(e) => onChange(e.target.value)}
          className={input}
        />
      );
  }
  return (
    <label className={`block ${WIDE.has(f.type) ? "md:col-span-2" : ""}`} onClick={(e) => f.type === "bool" && e.preventDefault()}>
      <span className="mb-1.5 block text-xs text-ice/60">
        {f.label}
        {f.required && " *"}
        {f.hint && <span className="text-ice/40"> — {f.hint}</span>}
      </span>
      {control}
    </label>
  );
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upload = async (file: File) => {
    setBusy(true);
    setErr("");
    const f = new FormData();
    f.set("file", file);
    const r = await uploadImage(f);
    setBusy(false);
    if (r.url) onChange(r.url);
    else setErr(r.error ?? "Upload failed");
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-ice/15 bg-ink">
      <div className="relative aspect-[16/9] bg-ice/5">
        {/* eslint-disable-next-line @next/next/no-img-element -- preview of any pasted URL, before it is saved */}
        {value && <img src={value} alt="" className="absolute inset-0 size-full object-cover" />}
        {!value && <span className="absolute inset-0 flex items-center justify-center text-xs text-ice/40">No photo</span>}
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-ink/70 text-sm">Uploading…</span>}
      </div>
      <div className="flex gap-2 p-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste an images.unsplash.com link or upload →" className={`${input} py-2 text-xs`} />
        <span className={`${ghost} relative shrink-0 cursor-pointer px-3 py-2 text-xs`}>
          Upload
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="absolute inset-0 cursor-pointer opacity-0" />
        </span>
      </div>
      {err && <p className="px-3 pb-2 text-xs text-sand">{err}</p>}
    </div>
  );
}
