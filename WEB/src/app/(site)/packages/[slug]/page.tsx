import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PackageDetail from "@/components/PackageDetail";
import { getSite } from "@/lib/content";

// all slugs are prerendered below, so skip the instant-navigation (Suspense) check for params
export const instant = false;

export async function generateStaticParams() {
  return (await getSite()).packages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const slug = (await params).slug;
  const p = (await getSite()).packages.find((x) => x.slug === slug);
  return p ? { title: `${p.title}, ${p.country} — Al Safr`, description: p.description } : {};
}

export default async function PackagePage({ params }: PageProps<"/packages/[slug]">) {
  const { slug } = await params;
  const { packages } = await getSite();
  const p = packages.find((x) => x.slug === slug);
  if (!p) notFound();
  const next = packages[(packages.indexOf(p) + 1) % packages.length];
  return <PackageDetail p={p} next={next} />;
}
