import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DisplayPanel } from "@/components/SiteChrome";
import { currentStaff } from "@/lib/admin-auth";
import { logout } from "../actions";
import NavLinks, { Links } from "./NavLinks";

export const metadata: Metadata = { title: "Al Safr CRM", robots: { index: false } };

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-ice md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex items-center gap-4 overflow-x-auto border-b border-ice/10 bg-night px-4 py-3 md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-5 md:py-7">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5 md:mb-8">
          <span className="size-6 rotate-45 rounded-[5px] bg-glow" />
          <span className="font-semibold tracking-tight">
            Al Safr <span className="text-ice/45">CRM</span>
          </span>
        </Link>
        {/* active link needs the URL, which is only known per request */}
        <Suspense fallback={<Links path="" />}>
          <StaffNav />
        </Suspense>
        <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-0 md:mt-auto md:flex-col md:items-stretch">
          <DisplayPanel placement="sidebar" />
          <Link href="/" className="text-sm text-ice/60 hover:text-ice">
            ↗ View site
          </Link>
          <form action={logout}>
            <button className="text-sm text-ice/60 hover:text-sand">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

/** links depend on the signed-in role, so they stream in per request */
async function StaffNav() {
  const me = await currentStaff();
  return (
    <>
      <NavLinks superAdmin={me?.role === "SUPER_ADMIN"} />
      {me && <p className="hidden truncate px-3 pt-4 text-xs text-ice/45 md:block">Signed in as {me.name}</p>}
    </>
  );
}
