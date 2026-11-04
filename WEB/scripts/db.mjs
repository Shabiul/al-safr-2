// Run a .sql file against DATABASE_URL from .env.local:  node scripts/db.mjs db/schema.sql
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)?.[1].trim();
if (!url) throw new Error("DATABASE_URL missing from .env.local");
const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });
try {
  await sql.unsafe(readFileSync(process.argv[2], "utf8"));
  console.log("ok:", process.argv[2]);
} finally {
  await sql.end();
}
