"use client";

import { useState } from "react";
import { promoScope, promoValid, type PromoUse } from "@/data/updates";
import { useSite } from "./ContentProvider";

/** coupon / discount code box: checks the code against the promo codes managed in the CRM as the visitor types; the server checks again on submit */
export default function Coupon({ use }: { use: PromoUse }) {
  const { promos, packages, forms } = useSite();
  const [code, setCode] = useState("");
  const [hit, setHit] = useState<{ ok: boolean; text: string } | null>(null);
  if (forms?.showCouponField === false) return null;
  const check = (raw: string) => {
    const c = raw.trim().toUpperCase();
    setCode(c);
    if (!c) return setHit(null);
    const p = promos.find((x) => x.code.toUpperCase() === c);
    if (!p) return setHit(c.length >= 4 ? { ok: false, text: "This code isn't recognised." } : null);
    if (p.active === false) return setHit({ ok: false, text: "This code isn't recognised." });
    if (p.endsAt && new Date(p.endsAt).getTime() < Date.now()) return setHit({ ok: false, text: "This code has expired." });
    if (!promoValid(p, use)) return setHit({ ok: false, text: `This code can't be used here. ${promoScope(p, (s) => packages.find((x) => x.slug === s)?.title)}.` });
    setHit({ ok: true, text: `${p.off || "Discount"} applied: ${p.title}${p.detail ? ` (${p.detail})` : ""}` });
  };
  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ice/60">Coupon / discount code (optional)</span>
        <input name="coupon" value={code} onChange={(e) => check(e.target.value)} placeholder="e.g. EARLY27" autoComplete="off" spellCheck={false} className="field uppercase placeholder:normal-case" />
      </label>
      {hit && (
        <p role="status" className={`mt-1.5 text-xs ${hit.ok ? "text-[#1fa77a]" : "text-sand"}`}>
          {hit.ok ? "✓ " : ""}
          {hit.text}
        </p>
      )}
    </div>
  );
}
