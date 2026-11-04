import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { readContent } from "@/lib/content";
import { COLLECTIONS } from "@/lib/content-schema";
import { card, Loading, PageHead } from "../../ui";

export default function ContentPage() {
  return (
    <>
      <PageHead title="Website content" sub="Change what visitors see on the site. Saving publishes straight away." />
      <Suspense fallback={<Loading />}>
        <Sections />
      </Suspense>
    </>
  );
}

async function Sections() {
  await requireAdmin();
  const content = await readContent();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {COLLECTIONS.map((c) => {
        const v = content[c.key];
        return (
          <Link key={c.key} href={`/admin/content/${c.key}`} className={`${card} transition-colors hover:border-glow`}>
            <p className="flex items-center justify-between font-semibold">
              {c.title}
              {Array.isArray(v) && <span className="text-sm font-normal tabular-nums text-ice/50">{v.length}</span>}
            </p>
            <p className="mt-2 text-sm text-ice/55">{c.sub}</p>
          </Link>
        );
      })}
    </div>
  );
}
