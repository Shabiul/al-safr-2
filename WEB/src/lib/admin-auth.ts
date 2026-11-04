// Staff logins for /admin: accounts in alsafr.staff, passwords hashed with scrypt,
// session = signed httpOnly cookie (staff id + expiry, HMAC with AUTH_SECRET), re-checked against the DB on every request.
// The very first SUPER_ADMIN is created from ADMIN_EMAIL + ADMIN_PASSWORD in .env.local when the staff table is empty.
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { sql } from "./db";

export type Role = "SUPER_ADMIN" | "STAFF";
export type Staff = { id: string; email: string; name: string; role: Role; active: boolean };

export const COOKIE = "alsafr_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours
const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const authConfigured = () => (process.env.AUTH_SECRET ?? "").length >= 32 && !!process.env.DATABASE_URL;

const same = (a: Buffer | string, b: Buffer | string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${(await scrypt(pw, salt, 64)).toString("base64")}`;
}

async function verifyPassword(pw: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  return same(await scrypt(pw, Buffer.from(salt, "base64"), 64), Buffer.from(hash, "base64"));
}

/** checks email + password; bootstraps the first super admin from .env.local */
export async function checkLogin(email: string, password: string): Promise<Staff | null> {
  if (!authConfigured()) return null;
  email = email.trim().toLowerCase();
  const [row] = await sql<(Staff & { passwordHash: string })[]>`select * from alsafr.staff where email = ${email}`;
  if (row) return row.active && (await verifyPassword(password, row.passwordHash)) ? row : null;

  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from alsafr.staff`;
  const bootEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const bootPw = process.env.ADMIN_PASSWORD ?? "";
  if (n === 0 && bootEmail && bootPw.length >= 8 && email === bootEmail && same(password, bootPw)) {
    const [created] = await sql<Staff[]>`
      insert into alsafr.staff (email, name, role, password_hash)
      values (${email}, ${"Owner"}, 'SUPER_ADMIN', ${await hashPassword(password)}) returning *`;
    return created;
  }
  return null;
}

const sign = (payload: string) => createHmac("sha256", process.env.AUTH_SECRET!).update(payload).digest("base64url");

export function sessionCookie(staffId: string) {
  const payload = `${staffId}.${Date.now() + MAX_AGE * 1000}`;
  return { name: COOKIE, value: `${payload}.${sign(payload)}`, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: MAX_AGE };
}

/** the signed-in staff member, or null; one DB lookup per request */
export const currentStaff = cache(async (): Promise<Staff | null> => {
  await connection(); // the expiry check below needs the real request time, never a prerender
  if (!authConfigured()) return null;
  const [id, exp, sig] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  if (!sig || !same(sig, sign(`${id}.${exp}`)) || Number(exp) < Date.now()) return null;
  const [staff] = await sql<Staff[]>`select id, email, name, role, active from alsafr.staff where id = ${id} and active`;
  return staff ?? null;
});

/** every admin page and action calls this first */
export async function requireAdmin() {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireSuperAdmin() {
  const staff = await requireAdmin();
  if (staff.role !== "SUPER_ADMIN") redirect("/admin?denied=1");
  return staff;
}
