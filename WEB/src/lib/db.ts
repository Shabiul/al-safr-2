// Postgres (Supabase) client for the alsafr schema. Server-only: DATABASE_URL carries the DB password.
import postgres from "postgres";

const make = () =>
  postgres(process.env.DATABASE_URL!, {
    prepare: false, // Supabase's transaction pooler (port 6543) doesn't support prepared statements
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    transform: postgres.camel, // snake_case columns <-> camelCase fields
    types: {
      // numeric -> number (prices fit comfortably in a double)
      numeric: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
      // timestamptz -> ISO string, so rows serialise the same as the rest of the app's dates
      isoTime: { to: 1184, from: [1184], serialize: (x: string) => x, parse: (x: string) => new Date(x).toISOString() },
    },
  });

// one pool per server process, surviving dev hot reloads
const g = globalThis as { __alsafrSql?: ReturnType<typeof make> };
export const sql = (g.__alsafrSql ??= make());
