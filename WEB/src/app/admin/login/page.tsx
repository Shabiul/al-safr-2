import type { Metadata } from "next";
import { authConfigured } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Al-Safar CRM", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm rounded-[28px] border border-ice/10 bg-night p-8 shadow-2xl">
        <p className="label text-glow">Al-Safar · CRM</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Team sign in</h1>
        {authConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-6 rounded-xl bg-sand/10 p-4 text-sm text-sand">
            Set <code>DATABASE_URL</code> and <code>AUTH_SECRET</code> (32+ characters) in <code>.env.local</code> and restart the server to enable the CRM.
          </p>
        )}
      </div>
    </main>
  );
}
