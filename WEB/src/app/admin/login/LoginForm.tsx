"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { btn, input } from "../ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-6 space-y-3">
      <input name="email" type="email" required autoFocus autoComplete="username" placeholder="Work email" className={input} />
      <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={input} />
      {state.error && <p role="alert" className="text-sm text-sand">{state.error}</p>}
      <button disabled={pending} className={`${btn} w-full disabled:opacity-60`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
