import type { Metadata } from "next";
import PackageSearchPage from "@/components/PackageSearch";

export const metadata: Metadata = {
  title: "Tours & holiday packages — Al Safr",
  description: "Browse guided tours and complete holiday packages by destination, style, departure month and budget.",
};

export default function PackagesPage() {
  return (
    <main className="min-h-screen pt-32">
      <PackageSearchPage />
    </main>
  );
}
