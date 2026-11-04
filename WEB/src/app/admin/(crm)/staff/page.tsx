import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { listStaff } from "@/lib/ops";
import { resetStaffPassword, setStaffActive } from "../../ops-actions";
import { card, day, input, Loading, PageHead } from "../../ui";
import AddStaff from "./AddStaff";

export default function StaffPage() {
  return (
    <>
      <PageHead title="Staff" sub="Who can sign in to the CRM. Super admins also manage markup, staff and reports." />
      <Suspense fallback={<Loading />}>
        <Staff />
      </Suspense>
    </>
  );
}

async function Staff() {
  const me = await requireSuperAdmin();
  const staff = await listStaff();
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="label text-[10px] text-ice/50">
            <tr className="border-b border-ice/10">
              {["Name", "Role", "Since", "Reset password", ""].map((h) => (
                <th key={h} className="px-5 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className={`border-b border-ice/5 last:border-0 ${s.active ? "" : "opacity-50"}`}>
                <td className="px-5 py-3">
                  <p className="font-medium">
                    {s.name}
                    {s.id === me.id && <span className="text-ice/45"> (you)</span>}
                  </p>
                  <p className="text-xs text-ice/50">{s.email}</p>
                </td>
                <td className="px-5 py-3 text-xs">{s.role === "SUPER_ADMIN" ? "Super admin" : "Staff"}</td>
                <td className="px-5 py-3 text-ice/55">{day(s.createdAt)}</td>
                <td className="px-5 py-3">
                  <form action={resetStaffPassword.bind(null, s.id)} className="flex gap-2">
                    <input name="password" type="password" minLength={8} required placeholder="New password" autoComplete="new-password" className={`${input} py-1.5 text-xs`} />
                    <button className="text-xs text-glow hover:underline">Set</button>
                  </form>
                </td>
                <td className="px-5 py-3 text-right">
                  {s.id !== me.id && (
                    <form action={setStaffActive.bind(null, s.id, !s.active)}>
                      <button className="text-xs text-ice/55 hover:text-sand">{s.active ? "Deactivate" : "Reactivate"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddStaff />
    </div>
  );
}
