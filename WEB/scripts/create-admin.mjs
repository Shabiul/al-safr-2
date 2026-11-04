// Create (or reset) a CRM super-admin in Supabase (alsafr.staff) and write the login to admin-credentials.txt.
//   node scripts/create-admin.mjs [email] [name]
// The password is random; it is written only to admin-credentials.txt (git-ignored), never printed.
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import postgres from "postgres";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)?.[1].trim();
if (!url) throw new Error("DATABASE_URL missing from .env.local");

const email = (process.argv[2] ?? "admin@alsafr.travel").trim().toLowerCase();
const name = process.argv[3] ?? "Admin";
const password = randomBytes(12).toString("base64url"); // 16 characters

// same format as hashPassword() in src/lib/admin-auth.ts
const salt = randomBytes(16);
const hash = `scrypt$${salt.toString("base64")}$${scryptSync(password, salt, 64).toString("base64")}`;

const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });
try {
  const [row] = await sql`
    insert into alsafr.staff (email, name, role, password_hash) values (${email}, ${name}, 'SUPER_ADMIN', ${hash})
    on conflict (email) do update set password_hash = excluded.password_hash, role = 'SUPER_ADMIN', active = true
    returning email, role, (xmax = 0) as created`;
  writeFileSync(
    new URL("../admin-credentials.txt", import.meta.url),
    `Al Safr CRM - super admin login\nSign in at: http://localhost:3000/admin\nEmail:    ${row.email}\nPassword: ${password}\n\nChange it any time: CRM -> Staff -> Reset password. Delete this file once the password is saved somewhere safe.\n`,
  );
  console.log(`${row.created ? "created" : "reset"} ${row.email} (${row.role}); login saved to admin-credentials.txt`);
} finally {
  await sql.end();
}
