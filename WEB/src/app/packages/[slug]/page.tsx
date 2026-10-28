import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PackageDetail from "@/components/PackageDetail";
import { getPackage, packages } from "@/data/packages";

// all slugs are prerendered below, so skip the instant-navigation (Suspense) check for params
export const instant = false;

export function generateStaticParams() {
  return packages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const p = getPackage((await params).slug);
  return p ? { title: `${p.title}, ${p.country} — Al Safr`, description: p.description } : {};
}

export default async function PackagePage({ params }: PageProps<"/packages/[slug]">) {
  const { slug } = await params;
  const p = getPackage(slug);
  if (!p) notFound();
  const next = packages[(packages.indexOf(p) + 1) % packages.length];
  return <PackageDetail p={p} next={next} />;
}
