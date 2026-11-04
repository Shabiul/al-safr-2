import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { readContent } from "@/lib/content";
import { collection } from "@/lib/content-schema";
import { Loading } from "../../../ui";
import Editor from "../Editor";

export default function SectionPage({ params }: PageProps<"/admin/content/[section]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Section params={params} />
    </Suspense>
  );
}

async function Section({ params }: Pick<PageProps<"/admin/content/[section]">, "params">) {
  await requireAdmin();
  const c = collection((await params).section);
  if (!c) notFound();
  const content = await readContent();
  const value = content[c.key];
  return (
    <>
      <Link href="/admin/content" className="text-sm text-ice/55 hover:text-ice">
        ← Website content
      </Link>
      <h1 className="mb-1 mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{c.title}</h1>
      <p className="mb-8 text-sm text-ice/55">{c.sub}</p>
      <Editor
        coll={c.key}
        initial={(Array.isArray(value) ? value : [value]) as unknown as Record<string, unknown>[]}
        packages={content.packages.map((p) => ({ slug: p.slug, title: `${p.title}, ${p.country}` }))}
      />
    </>
  );
}
