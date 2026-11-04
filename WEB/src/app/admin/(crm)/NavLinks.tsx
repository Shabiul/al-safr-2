"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "◧" },
  { href: "/admin/pipeline", label: "Pipeline", icon: "▥" },
  { href: "/admin/leads", label: "Leads", icon: "☰" },
  { href: "/admin/bookings", label: "Bookings", icon: "✓" },
  { href: "/admin/customers", label: "Customers", icon: "◉" },
  { href: "/admin/suppliers", label: "Suppliers", icon: "⇄" },
  { href: "/admin/content", label: "Website content", icon: "✎" },
  { href: "/admin/markup", label: "Markup", icon: "%", admin: true },
  { href: "/admin/reports", label: "Reports", icon: "▤", admin: true },
  { href: "/admin/staff", label: "Staff", icon: "☺", admin: true },
];

export default function NavLinks({ superAdmin }: { superAdmin: boolean }) {
  return <Links path={usePathname()} superAdmin={superAdmin} />;
}

/** static version for the Suspense fallback */
export function Links({ path, superAdmin = false }: { path: string; superAdmin?: boolean }) {
  return (
    <nav className="flex gap-1 md:flex-col">
      {LINKS.filter((l) => superAdmin || !l.admin).map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${active ? "bg-glow/12 font-semibold text-glow" : "text-ice/65 hover:bg-ice/5 hover:text-ice"}`}>
            <span className="w-4 text-center">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
