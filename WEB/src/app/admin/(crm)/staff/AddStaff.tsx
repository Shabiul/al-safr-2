"use client";

import { useActionState } from "react";
import { addStaff } from "../../ops-actions";
import { btn, card, input } from "../../ui";

export default function AddStaff() {
  const [state, action, pending] = useActionState(addStaff, {});
  return (
    <form action={action} key={state.ok ?? 0} className={`${card} h-fit space-y-3`}>
      <h2 className="font-semibold">Add staff member</h2>
      <input name="name" required placeholder="Full name" className={input} />
      <input name="email" type="email" required placeholder="Work email" autoComplete="off" className={input} />
      <input name="password" type="password" required minLength={8} placeholder="Temporary password (8+ characters)" autoComplete="new-password" className={input} />
      <select name="role" className={input}>
        <option value="STAFF">Staff</option>
        <option value="SUPER_ADMIN">Super admin</option>
      </select>
      {state.error && <p role="alert" className="text-sm text-sand">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-[#1fa77a]">Account created — share the password with them privately.</p>}
      <button disabled={pending} className={`${btn} disabled:opacity-60`}>
        {pending ? "Adding…" : "Add staff member"}
      </button>
    </form>
  );
}
